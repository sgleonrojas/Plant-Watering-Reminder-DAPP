App = {
  web3Provider: null,
  contracts: {},
  currentAccount: null,
  reminderInterval: null,
  targetNetwork: '1337', // Local network ID (Ganache)

  init: async function () {
    try {
      await App.initWeb3();
      await App.initContract();
      App.bindEvents();
      App.setupModal();
      App.startReminders();
      await App.loadPlants();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  },

  updateUI: function() {
    const walletDisplay = document.getElementById("walletAddress");
    if (App.currentAccount) {
      walletDisplay.innerText = `Connected: ${App.currentAccount}`;
    } else {
      walletDisplay.innerText = 'Not connected';
    }
  },

  initWeb3: async function () {
    try {
      if (window.ethereum) {
        App.web3Provider = window.ethereum;
        window.web3 = new Web3(window.ethereum);
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.currentAccount = accounts[0];
        App.updateUI();
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        App.web3Provider = window.web3.currentProvider;
        window.web3 = new Web3(window.web3.currentProvider);
      }
      // If no injected web3 instance is detected, fall back to Ganache
      else {
        App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
        window.web3 = new Web3(App.web3Provider);
      }
    } catch (error) {
      console.error("Web3 initialization error:", error);
      throw error;
    }
  },

  connectWallet: async function() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      App.currentAccount = accounts[0];
      App.updateUI();
      
      // Reload the page to reinitialize everything with the new account
      window.location.reload();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  },

  initContract: async function() {
    try {
      if (!App.currentAccount) {
        throw new Error('Please connect your wallet first');
      }

      // Load Adoption.json
      const response = await fetch('build/contracts/Adoption.json');
      const adoptionArtifact = await response.json();

      // Get the contract instance
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkId = parseInt(chainId, 16).toString();

      if (networkId !== App.targetNetwork) {
        throw new Error(`Please switch to the local network (Network ID: ${App.targetNetwork})`);
      }

      const deployedNetwork = adoptionArtifact.networks[App.targetNetwork];
      if (!deployedNetwork) {
        throw new Error(`Contract not deployed on network ${App.targetNetwork}. Please deploy the contract first.`);
      }

      // Create contract instance using window.web3
      App.contracts.Adoption = new window.web3.eth.Contract(
        adoptionArtifact.abi,
        deployedNetwork.address,
        { from: App.currentAccount }
      );

      console.log('Contract initialized:', App.contracts.Adoption);

      // Initialize PlantToken contract
      const plantTokenResponse = await fetch('build/contracts/PlantToken.json');
      const plantTokenArtifact = await plantTokenResponse.json();
      const plantTokenNetwork = plantTokenArtifact.networks[App.targetNetwork];
      
      if (plantTokenNetwork) {
        App.contracts.PlantToken = new window.web3.eth.Contract(
          plantTokenArtifact.abi,
          plantTokenNetwork.address,
          { from: App.currentAccount }
        );
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
      alert(error.message || 'Failed to initialize contract. Please make sure you are connected to the correct network.');
      throw error;
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
    $(document).on('click', '#connectWallet', App.connectWallet);
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

          // Save to backend first
          const saveResponse = await fetch('http://localhost:5000/add_plant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plantData)
          });

          if (!saveResponse.ok) {
            throw new Error("Failed to add plant to backend");
          }

          // Register plant in blockchain
          if (!App.contracts.Adoption) {
            throw new Error('Contract not initialized');
          }

          await App.contracts.Adoption.methods.registerPlant(plantData.id)
            .send({ from: App.currentAccount });

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
          if (error.message.includes('Contract not initialized')) {
            alert('Please wait for the contract to initialize and try again.');
          } else if (error.message.includes('Failed to add plant to backend')) {
            alert('Failed to add plant to backend. Please try again.');
          } else {
            alert('Failed to register plant on blockchain. Please try again.');
          }
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
      
      if (Array.isArray(reminders)) {
        // Clear existing reminders that are no longer active
        const remindersList = document.getElementById('reminders-list');
        const currentReminders = remindersList.getElementsByClassName('reminder-item');
        const currentReminderIds = Array.from(currentReminders).map(
          item => item.getAttribute('data-plant-id')
        );
        
        reminders.forEach(reminder => {
          if (reminder.account && App.currentAccount && 
              reminder.account.toLowerCase() === App.currentAccount.toLowerCase() &&
              !currentReminderIds.includes(reminder.id.toString())) {
            App.showReminder(reminder);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  },

  showReminder: async function (reminder) {
    try {
      console.log('Showing reminder for plant:', reminder);
      const response = await fetch(`http://localhost:5000/get_plant/${reminder.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch plant: ${response.status} ${response.statusText}`);
      }
      
      const plant = await response.json();
      console.log('Fetched plant data:', plant);

      if (!plant) {
        console.error('Plant not found:', reminder.id);
        return;
      }

      // Create reminder element
      const reminderElement = document.createElement('div');
      reminderElement.className = 'reminder-item';
      reminderElement.setAttribute('data-plant-id', plant.id);

      // Add plant image
      const plantImage = document.createElement('img');
      plantImage.src = plant.picture;
      plantImage.className = 'reminder-plant-image';
      plantImage.alt = plant.name;

      // Add plant info
      const plantInfo = document.createElement('div');
      plantInfo.className = 'reminder-plant-info';
      plantInfo.innerHTML = `
        <p><strong>Time to water ${plant.name} in ${plant.location}!</strong></p>
      `;

      // Add action buttons
      const actionButtons = document.createElement('div');
      actionButtons.className = 'reminder-actions';
      
      const doneButton = document.createElement('button');
      doneButton.className = 'btn-done';
      doneButton.textContent = 'Done';
      doneButton.onclick = async () => {
        try {
          if (!App.contracts.Adoption) {
            throw new Error('Contract not initialized');
          }

          const result = await App.contracts.Adoption.methods.waterPlant(reminder.id)
            .send({ from: App.currentAccount });

          if (result.status) {
            reminderElement.remove();
            alert('Plant watered successfully!');
            window.location.reload();
          }
        } catch (error) {
          console.error("Error watering plant:", error);
          
          // Extract error message from contract revert
          let errorMessage = error.message;
          if (error.message.includes('revert')) {
            const revertMessage = error.message.match(/revert\s(.+?)(?:\.|$)/i);
            if (revertMessage && revertMessage[1]) {
              errorMessage = revertMessage[1].trim();
            }
          }

          // Handle specific error cases
          if (errorMessage.includes('PlantDoesNotExist')) {
            alert('This plant is not registered in the blockchain. Please register it first.');
          } else if (errorMessage.includes('WateringCooldownNotElapsed')) {
            alert('Please wait longer before watering this plant again.');
          } else if (errorMessage.includes('Contract not initialized')) {
            alert('Please wait for the contract to initialize and try again.');
          } else {
            alert('Failed to water plant: ' + errorMessage);
          }
        }
      };

      const remindLaterButton = document.createElement('button');
      remindLaterButton.className = 'btn-remind-later';
      remindLaterButton.textContent = 'Remind Later';
      remindLaterButton.onclick = () => {
        reminderElement.remove();
      };

      actionButtons.appendChild(doneButton);
      actionButtons.appendChild(remindLaterButton);

      // Assemble the reminder element
      reminderElement.appendChild(plantImage);
      reminderElement.appendChild(plantInfo);
      reminderElement.appendChild(actionButtons);

      // Add to reminders list
      const remindersList = document.getElementById('reminders-list');
      remindersList.appendChild(reminderElement);
    } catch (error) {
      console.error("Error showing reminder:", error);
      alert('Failed to load plant details. Please try again.');
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
  },

  loadPlants: async function() {
    try {
      console.log('Starting loadPlants function...');
      console.log('Current account:', App.currentAccount);
      
      const response = await fetch('http://localhost:5000/get_plants');
      if (!response.ok) {
        throw new Error(`Failed to fetch plants: ${response.status} ${response.statusText}`);
      }
      const plants = await response.json();
      console.log('All plants received from backend:', plants);
      
      // Clear existing plants
      const plantsRow = document.getElementById('petsRow');
      if (!plantsRow) {
        console.error('Could not find petsRow element');
        return;
      }
      plantsRow.innerHTML = '';

      // Display each plant
      let displayedCount = 0;
      plants.forEach(plant => {
        console.log('Checking plant:', {
          name: plant.name,
          plantAccount: plant.account,
          currentAccount: App.currentAccount,
          isMatch: plant.account && App.currentAccount && 
                   plant.account.toLowerCase() === App.currentAccount.toLowerCase()
        });
        
        if (plant.account && App.currentAccount && 
            plant.account.toLowerCase() === App.currentAccount.toLowerCase()) {
          App.displayPlant(plant);
          displayedCount++;
        }
      });
      
      console.log(`Displayed ${displayedCount} plants`);
      
      if (displayedCount === 0) {
        plantsRow.innerHTML = '<div class="col-12 text-center"><p>No plants found for your account. Try registering a new plant!</p></div>';
      }
    } catch (error) {
      console.error('Error loading plants:', error);
      document.getElementById('petsRow').innerHTML = 
        '<div class="col-12 text-center"><p>Error loading plants. Please make sure the backend server is running.</p></div>';
    }
  },

  displayPlant: function(plant) {
    console.log('Displaying plant:', plant);
    const plantsRow = document.getElementById('petsRow');
    
    const plantCol = document.createElement('div');
    plantCol.className = 'col-sm-6 col-md-4 col-lg-3 mb-4';

    const card = document.createElement('div');
    card.className = 'card h-100';

    const img = document.createElement('img');
    img.className = 'card-img-top';
    img.src = plant.picture;
    img.alt = plant.name;
    img.style.height = '200px';
    img.style.objectFit = 'cover';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = plant.name;

    const speciesText = document.createElement('p');
    speciesText.className = 'card-text';
    speciesText.textContent = `Species: ${plant.species}`;

    const locationText = document.createElement('p');
    locationText.className = 'card-text';
    locationText.textContent = `Location: ${plant.location}`;

    const scheduleText = document.createElement('p');
    scheduleText.className = 'card-text';
    scheduleText.textContent = `Watering Time: ${plant.schedule}`;

    cardBody.appendChild(title);
    cardBody.appendChild(speciesText);
    cardBody.appendChild(locationText);
    cardBody.appendChild(scheduleText);

    card.appendChild(img);
    card.appendChild(cardBody);
    plantCol.appendChild(card);
    plantsRow.appendChild(plantCol);
    console.log('Plant display element added to DOM');
  }
};

$(function () {
  $(window).on('load', App.init);
  $(window).on('unload', App.cleanup);
});
