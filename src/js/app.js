App = {
  web3Provider: null,
  contracts: {},
  currentAccount: null,
  reminderInterval: null,

  init: async function () {
    await App.initWeb3();
    App.bindEvents();
    App.setupModal();
    App.startReminders();
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      window.web3 = new Web3(window.ethereum);
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        App.currentAccount = accounts[0];
        document.getElementById("walletAddress").innerText = `Connected: ${App.currentAccount}`;
      } catch (error) {
        console.error("User denied wallet connection", error);
      }
    } else {
      console.log("No Ethereum wallet detected");
    }
  },

  setupModal: function() {
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
      registerModal.addEventListener('show.bs.modal', function () {
        if (!App.currentAccount) {
          alert('Please connect your wallet first!');
          const modal = bootstrap.Modal.getInstance(registerModal);
          if (modal) {
            modal.hide();
          }
          $('#connectWallet').click();
        }
      });
    }

    const plantForm = document.getElementById('plantForm');
    if (plantForm) {
      plantForm.addEventListener('submit', App.handleSubmit);
    }
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  startReminders: function() {
    // Initial check for reminders
    App.fetchReminders();
    // Check reminders every 20 seconds
    App.reminderInterval = window.setInterval(App.fetchReminders, 20000);
  },

  handleSubmit: async function (event) {
    event.preventDefault();
    
    if (!App.currentAccount) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/total_plants');
      const data = await response.json();
      
      const formData = new FormData(event.target);
      const plantData = {
        id: data.totalPlants,
        name: formData.get('plantName'),
        schedule: formData.get('plantSchedule'),
        species: formData.get('plantSpecies'),
        location: formData.get('plantLocation'),
        account: App.currentAccount
      };

      const pictureFile = formData.get('plantPicture');
      const reader = new FileReader();

      reader.onloadend = async function () {
        try {
          plantData.picture = reader.result;

          const saveResponse = await fetch('http://localhost:5000/add_plant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plantData)
          });

          if (!saveResponse.ok) {
            throw new Error("Failed to add plant");
          }

          const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
          if (modal) {
            modal.hide();
          }
          
          // Clear the form
          event.target.reset();
          
          // Refresh the page after a short delay
          setTimeout(() => window.location.reload(), 500);
        } catch (error) {
          console.error("Error saving plant:", error);
          alert('Failed to add plant. Please try again.');
        }
      };

      reader.readAsDataURL(pictureFile);
    } catch (error) {
      console.error("Error in form submission:", error);
      alert('Failed to add plant. Please try again.');
    }
  },

  fetchReminders: async function () {
    try {
      const response = await fetch('http://localhost:5000/get_reminders');
      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }
      const reminders = await response.json();
      
      // Clear existing reminders
      $('.reminder-popup').remove();

      if (Array.isArray(reminders)) {
        reminders.forEach(reminder => {
          if (reminder.account && App.currentAccount && 
              reminder.account.toLowerCase() === App.currentAccount.toLowerCase()) {
            App.showReminder(reminder);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  },

  showReminder: function(reminder) {
    // Create elements using safe DOM methods
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close';
    closeBtn.textContent = '×';
    modalContent.appendChild(closeBtn);

    const title = document.createElement('h2');
    title.textContent = 'Plant Watering Reminder!';
    modalContent.appendChild(title);

    const plantInfo = document.createElement('p');
    plantInfo.textContent = `Time to water your ${reminder.plantName}!`;
    modalContent.appendChild(plantInfo);

    if (reminder.imageUrl) {
      const img = document.createElement('img');
      // Validate image URL
      const validUrl = new URL(reminder.imageUrl);
      if (validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
        img.src = reminder.imageUrl;
        img.alt = reminder.plantName;
        img.style.maxWidth = '200px';
        modalContent.appendChild(img);
      }
    }

    const modal = document.getElementById('reminderModal');
    // Clear existing content
    modal.innerHTML = '';
    modal.appendChild(modalContent);
    modal.style.display = 'block';

    // Close button event listener
    closeBtn.onclick = function() {
      modal.style.display = 'none';
    }

    // Click outside to close
    window.onclick = function(event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    }
  },

  handleAdopt: async function (event) {
    event.preventDefault();
    const plantId = parseInt($(event.target).data('id'));
    const instance = await App.contracts.Adoption.deployed();
    try {
      await instance.adopt(plantId, { from: App.currentAccount });
      await App.markAdopted();
    } catch (err) {
      console.error("Adopt error:", err.message);
    }
  },

  markAdopted: async function () {
    const instance = await App.contracts.Adoption.deployed();
    const adopters = await instance.getAdopters.call();
    adopters.forEach((adopter, i) => {
      if (adopter !== '0x0000000000000000000000000000000000000000') {
        $('.panel-plant').eq(i).find('button').text('Watered').attr('disabled', true);
      }
    });
  },

  cleanup: function() {
    if (App.reminderInterval) {
      clearInterval(App.reminderInterval);
    }
  }
};

$(function () {
  $(window).on('load', App.init);
  $(window).on('unload', App.cleanup);
});
