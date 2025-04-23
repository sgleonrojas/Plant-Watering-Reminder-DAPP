App = {
  web3Provider: null,
  contracts: {},
  currentAccount: null,

  init: async function () {
    await App.initWeb3();

    if (!App.currentAccount) {
      console.log("Wallet not connected.");
      return;
    }

    const plantsRow = $('#plantsRow');
    const plantTemplate = $('#plantTemplate');

    $.getJSON('../plants.json', function (data) {
      data.forEach(plant => {
        if (plant.account.toLowerCase() === App.currentAccount.toLowerCase()) {
          const newPlant = $(plantTemplate.html());
          newPlant.find('.panel-title').text(plant.name);
          newPlant.find('img').attr('src', plant.picture);
          newPlant.find('.plant-species').text(plant.species);
          newPlant.find('.plant-schedule').text(plant.schedule);
          newPlant.find('.plant-location').text(plant.location);
          newPlant.find('.btn-adopt').attr('data-id', plant.id);

          plantsRow.append(newPlant);
        }
      });
    });

    App.bindEvents();
    setInterval(App.fetchReminders, 20000);
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum);
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

    return App.initContract();
  },

  initContract: function () {
    $.getJSON('Adoption.json', function (data) {
      App.contracts.Adoption = TruffleContract(data);
      App.contracts.Adoption.setProvider(App.web3Provider);
      return App.markAdopted();
    });
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-primary[type=submit]', App.handleSubmit);
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

  fetchReminders: async function () {
    try {
      const response = await fetch('http://localhost:5000/get_reminders');
      const reminders = await response.json();

      reminders.forEach(reminder => {
        if (reminder.account.toLowerCase() === App.currentAccount.toLowerCase()) {
          const popup = $('<div class="reminder-popup"></div>');
          popup.append(`<img src="${reminder.picture}" alt="${reminder.name}">`);
          popup.append(`<p>Name: ${reminder.name}</p>`);
          popup.append(`<p>Location: ${reminder.location}</p>`);
          $('body').append(popup);
        }
      });
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  },

  resetAndCloseForm: function () {
    $('#plantForm')[0].reset();
    $('#registerModal').modal('hide');
  },

  handleSubmit: function (event) {
    event.preventDefault();

    fetch('http://localhost:5000/total_plants')
      .then(response => response.json())
      .then(data => {
        const newId = data.totalPlants;
        const plantData = {
          id: newId,
          name: $('#plantName').val(),
          schedule: $('#plantSchedule').val(),
          species: $('#plantSpecies').val(),
          location: $('#plantLocation').val(),
          account: App.currentAccount
        };

        const pictureFile = $('#plantPicture')[0].files[0];
        const reader = new FileReader();

        reader.onloadend = function () {
          plantData.picture = reader.result;

          fetch('http://localhost:5000/add_plant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plantData)
          })
            .then(response => {
              if (!response.ok) throw new Error("Failed to add plant");

              return App.contracts.Adoption.deployed()
                .then(instance =>
                  instance.handleSubmit(plantData.id, {
                    from: App.currentAccount,
                    gas: 300000,
                    gasPrice: '20000000000'
                  })
                );
            })
            .then(() => {
              console.log("Transaction successful");
              window.location.reload();
            })
            .catch(error => console.error("Error in plant submission:", error));
        };

        reader.readAsDataURL(pictureFile);
        App.resetAndCloseForm();
      })
      .catch(error => console.error("Failed to fetch plant count:", error));
  }
};

$(function () {
  $(window).on('load', App.init);
});
