"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

// let map, mapEvent;
//////////////////////////////////////////////////
// workout class (parent class for running and cycling class)
class Workout {
  // date created
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    /*
    this.date=new Date()
    this.id=  (new Date() + "").slice(-10);
    TODO: USE SOME LIBRARY TO GENERATE UNIQUE ID

    to work with ES6 javascript
    */
    this.coords = coords; //[lon,lat]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }
  //increase number of clicks
  _click() {
    this.clicks++;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// CHILD CLASSES (of workout class)
class Running extends Workout {
  // set workout type property
  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;

    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  // set workout type property
  type = "cycling";

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;

    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//////////////////////////////////////////////////
// App class  (ARCHITECTURE )
class App {
  // private class fields
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // get data from local storage
    this._getLocalStorage();
    // get current position
    this._getPosition();

    // form submit
    form.addEventListener("submit", this._newWorkout.bind(this));

    // change event on input
    inputType.addEventListener("change", this._toggleElevationField);

    // move map to event
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  // methods
  _getPosition() {
    // using geolocation
    navigator?.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("could not get position");
      }
    );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    // draw map
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // map event : handling click on map
    this.#map.on("click", this._showForm.bind(this));

    // render marker
    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    // show workout form
    form.classList.remove("hidden");

    // focus on input immediatetly
    inputDistance.focus();
  }
  _hideForm() {
    // empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }
  _toggleElevationField(e) {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    const validInputs = (...input) =>
      input.every((input) => Number.isFinite(input));

    const allPositive = (...input) => input.every((input) => input > 0);

    // get data from the form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workout running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      // get if data is valid
      if (
        /* !Number.isFinite(distance) */
        /* !Number.isFinite(duration) */
        /*!Number.isFinite(cadence)*/

        !validInputs(duration, distance, cadence) ||
        !allPositive(duration, distance, cadence)
      )
        return alert("input must be a positive number");

      // running object
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout cycling, create  cyclingobject
    if (type === "cycling") {
      const elevationGain = +inputElevation.value;

      // get if data is valid
      if (
        !validInputs(duration, distance, elevationGain) ||
        !allPositive(duration, distance)
      )
        return alert("input must be a positive number");

      // cycling object
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    // add new object to workout array
    // push workouts to array
    this.#workouts.push(workout);

    // render workout on map as marker
    this._renderWorkoutMarker(workout);

    // render workout on list
    this._renderWorkout(workout);

    // hide form + clear input fields
    // clear workout form (input)
    this._hideForm();

    // set locale storage
    this._setLocaleStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWith: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴🏽‍♀️"} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴🏽‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          
`;

    // if running
    if (workout.type === "running") {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
         </li>
`;
    }

    // if cycling
    if (workout.type === "cycling") {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
`;
    }
    // insert html
    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    // get parent element of target
    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    // get workout data
    const workout = this.#workouts.find(
      (workout) => workout.id === workoutEl.dataset.id
    );

    // move to map
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // using the public interface example
    // workout._click();
  }
  _setLocaleStorage() {
    localStorage.setItem("workout", JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workout"));

    // check if no data
    if (!data) return;

    // render workouts

    // data.forEach((workout) => {
    //   this._renderWorkout(workout);
    //   this._renderWorkoutMarker(workout);
    // });

    // set workouts array to data
    this.#workouts = data;

    this.#workouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }
}

const app = new App();

/*

TODO: DELETE WORKOUT ELEMENT FEATURE
TODO: FILTER WORKOUT FEATURE (BY CERTAIN FIELDS)
TODO: EDIT WORKOUT
TODO: DELETE ALL WORK OUTS
TODO: FIX OBJECT PROBLEM (BUILD NEW RUNNING AND CYCLING CLASS WITH OBJECT FROM LOCAL STORAGE)
TODO: CREATE MORE REALISTIC ERROR AND CONFIRMATION MESSAGES


//TOUGH
TODO: POSITION MAP TO SHOW ALL WORKOUTS
TODO: GEOLOCATION
TODO: DISPLAY WEATHER DATA FOR WORKOUT DATE AND TIME
TODO: DRAW LINES AND SHAPE USING LEAFLET


*/
