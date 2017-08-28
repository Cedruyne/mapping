var Pins = (function() {

  const ACK = 0,
        COORDS_NOT_FOUND = 1,
        COORDS_NOT_STORED = 2,
        NO_GEOLOCATION = 3;

  const COULEURS_ERREURS = ['yellow', 'orange', 'red', 'beige'];

  const DEF_LATITUDE = 48.7,
        DEF_LONGITUDE = 2.4,
        DEF_ZOOM = 12;

  this.trucksMap = L.map('trucksMap');
  this.markers = [];

  /** Initialisation de la carte à une position donnée ;
   * @param profil une structure "lat", "lng"
   */
  this.initMap = function (position) {
      console.log("Initialisation de la carte");
      console.log(position);

      let x = position.coords.latitude;
      let y = position.coords.longitude;

      this.trucksMap.setView([x, y], DEF_ZOOM);
      console.log("Carte recentrée : " + x + " " + y);
      var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      var osmAttrib='<a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';
      var osm = L.tileLayer(osmUrl, {
          attribution: osmAttrib}
        ).addTo(this.trucksMap);
  }

  /**
   * Détection des possibilités du navigateur, puis lance la fonction donnée
   * avec en argument une structure "lat", "long"
   * @return Promise
   */
  function gpsPicker() {
      return new Promise(function (resolve, reject) {
          if(navigator.geolocation){
              navigator.geolocation.getCurrentPosition(
                  resolve,
                  reject,
                  {timeout: 10000}
              );
          } else {
              // alert('Pas de géolocalisation');
              reject({"lat": DEF_LATITUDE, "long": DEF_LONGITUDE, "error": NO_GEOLOCATION});
          }
      });
  }

  /**
   * exécutée lorsque les coordonnées GPS ont bien été récupérées par l'application
   * @param Geolocation position
   * @return Promise
   */
  /*this.positionMake = function (position) {
      console.log("GPS");
      console.log(position);
      return new Promise(function (resolve, reject) {
          let x = position.coords.latitude;
          let y = position.coords.longitude;
          let t = Math.round(new Date().getTime());

          current = {
              "lat": x,
              "long": y,
              "timestamp": t,
              "error": ACK
          };
          resolve(current);
      });
  };*/

  /**
   * exécutée lorsque les coordonnées GPS n'ont pu être récupérées par l'application
   * @param Geolocation position
   * @return Promise
   */
  this.positionFail = function(err){

      console.log("No GPS");
      console.log(err);

      return new Promise(function (resolve, reject) {

          let current = {};
          console.log("Erreur de géolocalisation");
          current.error = COORDS_NOT_FOUND;
          if (typeof current.timestamp == 'undefined')
          {
                  current.lat = DEF_LATITUDE;
                  current.long = DEF_LONGITUDE;
          }
          current.timestamp = Math.round(new Date().getTime());
          reject(current);
      });
  };

/*  this.warning = function (profil) {
      var message = "<h1 class='no-init'>Vous êtes en cours de géo-localisation</h1>";
      console.log(message);
      if ($(".contenu .no-init").length == 0) { $(".contenu").prepend(message); }
      return new Promise (function (resolve, reject) {
          reject(message);
      });
  };*/

  return {
      "markers" : this.markers,
      "trucksMap" : this.trucksMap,
      "positionFail": this.positionFail,
      "initMap": this.initMap,
      "ERRORS_COLORS": COULEURS_ERREURS,
      "gpsPicker" : function (id, callback) { return gpsPicker(id, callback); }
  };
})();
