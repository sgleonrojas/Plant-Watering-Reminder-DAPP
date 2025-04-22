App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    await App.initWeb3(); // Initialize Web3

    // Get the current Ethereum account address
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var currentAccount = accounts[0]; // Assuming the first account is the one logged in

      // Load pets whose accounts match the currently logged-in account.
      $.getJSON('../pets.json', function(data) {
        var petsRow = $('#petsRow');
        var petTemplate = $('#petTemplate');

        // Iterate through each pet in the data
        for (i = 0; i < data.length; i++) {
          // Check if the pet's account matches the current account
          if (data[i].account === currentAccount) {
            // If it matches, populate the HTML element with the pet's information
            petTemplate.find('.panel-title').text(data[i].name);
            petTemplate.find('img').attr('src', data[i].picture);
            petTemplate.find('.pet-breed').text(data[i].breed);
            petTemplate.find('.pet-age').text(data[i].age);
            petTemplate.find('.pet-location').text(data[i].location);
            petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

            petsRow.append(petTemplate.html());
          }
        }
      });
    });

    // Periodically fetch reminders (every 20 seconds)
    setInterval(App.fetchReminders, 20000);
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Adoption.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-success', App.handleSubmit);
  },

  markAdopted: function() {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;
      console.log("adopted being called");
      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      console.log("Adopters:", adopters);
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          console.log("maradopted", adopters[i], i);
          $('.panel-pet').eq(i).find('button').text('Watered').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        return adoptionInstance.adopt(petId, { from: account });
      }).then(function(result) {
        // Call markAdopted after the adoption transaction is confirmed
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  fetchReminders: async function() {
    try {
      // Fetch reminders from the backend (Flask server)
      const response = await fetch('http://localhost:5000/get_reminders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }

      // Parse the JSON response
      const data = await response.json();
      
      // Get the current account from Web3
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.error('Error fetching accounts:', error);
          return;
        }

        var account = accounts[0];

        try {
          data.forEach(function(reminder) {
            // Check if the reminder's account matches the current account
            if (reminder.account === account) {
              // Create a div element for the reminder popup
              var reminderPopup = document.createElement('div');
              reminderPopup.classList.add('reminder-popup');

              // Create HTML elements to display reminder information
              var name = document.createElement('p');
              name.textContent = 'Name: ' + reminder.name;

              var location = document.createElement('p');
              location.textContent = 'Location: ' + reminder.location;

              var img = document.createElement('img');
              img.src = reminder.picture; // Assuming 'picture' contains the image URL
              img.alt = reminder.name; // Set alt text to the name of the plant

              // Append elements to the reminder popup
              reminderPopup.appendChild(img);
              reminderPopup.appendChild(name);
              reminderPopup.appendChild(location);

              // Append the reminder popup to the left side of the screen
              document.body.appendChild(reminderPopup);
            }
          });
        } catch (error) {
          console.error('Error processing reminders:', error);
        }
      });
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  },

  resetAndCloseForm: function() {
    // Reset the form
    $('#plantForm')[0].reset();

    // Close the modal
    $('#registerModal').modal('hide');
  },

  handleSubmit: function(event) {
    event.preventDefault();
    console.log('handleSubmit function called');

    // Fetch total number of objects in pets.json
    fetch('http://localhost:5000/total_pets')
      .then(response => response.json())
      .then(data => {
        var newId = data.totalPets;

        var form = document.getElementById('plantForm');
        var formData = new FormData(form);

        console.log('Form data:', formData);

        web3.eth.getAccounts(function(error, accounts) {
          if (error) {
            console.log(error);
          }

          var account = accounts[0]; // Assuming the first account is the one logged in

          var petData = {
            id: newId,
            name: $('#plantName').val(),
            age: $('#plantAge').val(),
            breed: $('#plantBreed').val(),
            location: $('#plantLocation').val(),
            account: account
          };

          console.log(petData);
          const schedule = petData.age.split(':');
          if (schedule.length != 2 || isNaN(parseInt(schedule[0])) || isNaN(parseInt(schedule[1]))) {
            alert('Please enter a valid schedule in the format of hours:minutes');
            return false;
          }
          const hour = parseInt(schedule[0]);
          const minute = parseInt(schedule[1]);
          if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            alert('Please enter a valid schedule in the format of hours:minutes');
            return false;
          }

          var pictureFile = $('#plantPicture')[0].files[0];
          var reader = new FileReader();
          reader.onloadend = function() {
            petData.picture = reader.result;

            console.log('Sending data to server...');

            fetch('http://localhost:5000/add_pet', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(petData)
            })
              .then(response => {
                if (response.ok) {
                  console.log('Pet added successfully');
                  App.contracts.Adoption.deployed().then(function(instance) {
                    adoptionInstance = instance;

                    return adoptionInstance.handleSubmit(petData.id, {
                      from: account,
                      gas: 300000,
                      gasPrice: '20000000000'
                    });
                  }).then(function(result) {
                    console.log("Transaction confirmed:", result);
                    window.location.reload();
                  }).catch(function(err) {
                    console.log(err.message);
                  });
                } else {
                  console.error('Failed to add pet:', response.statusText);
                }
              })
              .catch(error => {
                console.error('Error adding pet:', error);
              });
          };
          reader.readAsDataURL(pictureFile);
          App.resetAndCloseForm();
        });
      })
      .catch(error => {
        console.error('Error fetching total pets:', error);
      });
  },
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
