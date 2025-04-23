App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    await App.initWeb3();

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var currentAccount = accounts[0];

      $.getJSON('../plants.json', function (data) {
        var plantsRow = $('#plantsRow');
        var plantTemplate = $('#plantTemplate');

        for (let i = 0; i < data.length; i++) {
          if (data[i].account === currentAccount) {
            plantTemplate.find('.panel-title').text(data[i].name);
            plantTemplate.find('img').attr('src', data[i].picture);
            plantTemplate.find('.plant-species').text(data[i].species);
            plantTemplate.find('.plant-schedule').text(data[i].schedule);
            plantTemplate.find('.plant-location').text(data[i].location);
            plantTemplate.find('.btn-adopt').attr('data-id', data[i].id);

            plantsRow.append(plantTemplate.html());
          }
        }
      });
    });

    setInterval(App.fetchReminders, 20000);
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.enable();
      } catch (error) {
        console.error("User denied account access");
      }
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON('Adoption.json', function (data) {
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      App.contracts.Adoption.setProvider(App.web3Provider);
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-success', App.handleSubmit);
  },

  markAdopted: function () {
    App.contracts.Adoption.deployed().then(function (instance) {
      return instance.getAdopters.call();
    }).then(function (adopters) {
      for (let i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-plant').eq(i).find('button').text('Watered').attr('disabled', true);
        }
      }
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  handleAdopt: function (event) {
    event.preventDefault();
    var plantId = parseInt($(event.target).data('id'));

    web3.eth.getAccounts(function (error, accounts) {
      if (error) console.log(error);
      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function (instance) {
        return instance.adopt(plantId, { from: account });
      }).then(() => App.markAdopted())
        .catch(err => console.log(err.message));
    });
  },

  fetchReminders: async function () {
    try {
      const response = await fetch('http://localhost:5000/get_reminders');
      if (!response.ok) throw new Error('Failed to fetch reminders');

      const data = await response.json();
      web3.eth.getAccounts(function (error, accounts) {
        if (error) {
          console.error('Error fetching accounts:', error);
          return;
        }

        var account = accounts[0];

        data.forEach(function (reminder) {
          if (reminder.account === account) {
            var popup = document.createElement('div');
            popup.classList.add('reminder-popup');

            var name = document.createElement('p');
            name.textContent = 'Name: ' + reminder.name;

            var location = document.createElement('p');
            location.textContent = 'Location: ' + reminder.location;

            var img = document.createElement('img');
            img.src = reminder.picture;
            img.alt = reminder.name;

            popup.appendChild(img);
            popup.appendChild(name);
            popup.appendChild(location);

            document.body.appendChild(popup);
          }
        });
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
    console.log('handleSubmit called');

    fetch('http://localhost:5000/total_plants')
      .then(response => response.json())
      .then(data => {
        var newId = data.totalPlants;

        web3.eth.getAccounts(function (error, accounts) {
          if (error) return console.log(error);
          var account = accounts[0];

          const schedule = $('#plantSchedule').val();
          const scheduleParts = schedule.split(':');
          if (scheduleParts.length !== 2 || isNaN(scheduleParts[0]) || isNaN(scheduleParts[1])) {
            alert('Enter schedule as HH:MM');
            return;
          }

          const plantData = {
            id: newId,
            name: $('#plantName').val(),
            schedule: schedule,
            species: $('#plantSpecies').val(),
            location: $('#plantLocation').val(),
            account: account
          };

          const pictureFile = $('#plantPicture')[0].files[0];
          const reader = new FileReader();
          reader.onloadend = function () {
            plantData.picture = reader.result;

            console.log('Sending plant data...');

            fetch('http://localhost:5000/add_plant', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(plantData)
            })
              .then(response => {
                if (!response.ok) throw new Error('Failed to add plant');

                return App.contracts.Adoption.deployed().then(instance =>
                  instance.handleSubmit(plantData.id, {
                    from: account,
                    gas: 300000,
                    gasPrice: '20000000000'
                  })
                );
              })
              .then(result => {
                console.log("Transaction confirmed:", result);
                window.location.reload();
              })
              .catch(error => console.error('Error adding plant:', error));
          };
          reader.readAsDataURL(pictureFile);
          App.resetAndCloseForm();
        });
      })
      .catch(error => {
        console.error('Error fetching total plants:', error);
      });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
