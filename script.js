"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

let map;
let mapEvent;

// using geolocation
navigator?.geolocation.getCurrentPosition(
  function (position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    // draw map
    map = L.map("map").setView(coords, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // map event : handling click on map
    map.on("click", function (mapE) {
      mapEvent = mapE;
      console.log(mapEvent);

      // show workout form
      form.classList.remove("hidden");

      // focus on input immediatetly
      inputDistance.focus();
    });
  },
  function () {
    alert("could not get position");
  }
);

// form submit
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const { lat, lng } = mapEvent.latlng;

  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWith: 100,
        autoClose: false,
        closeOnClick: false,
        className: "running-popup",
      })
    )
    .setPopupContent(`${inputDistance.value}`)
    .openPopup();

  // clear workout form (input)
  inputDistance.value =
    inputDuration.value =
    inputCadence.value =
    inputElevation.value =
      "";
});

inputType.addEventListener("change", function (e) {
  inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
});
