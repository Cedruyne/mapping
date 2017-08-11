var Pins = (function () {
    'use strict';
    const ACK = 0,
          COORDS_NOT_FOUND = 1,
          COORDS_NOT_STORED = 2,
          NO_GEOLOCATION = 3;

    const COULEURS_ERREURS = ['yellow', 'orange', 'red', 'beige'];

    const DEF_LATITUDE = 48.7,
          DEF_LONGITUDE = 2.4;
          DEF_ZOOM = 12;

    this.trafficMap = L.map('leafletmap');
    this.markers = [];
    this.me = null;

    /**
     * exécutée lorsque les coordonnées GPS ont bien été récupérées par l'application
     * @param Geolocation position
     * @return Promise
     */
    this.positionMake = function (position) {
        console.log("GPS")
        console.log(position);
        return new Promise(function (resolve, reject) {
            var x = position.coords.latitude;
            var y = position.coords.longitude;
            current = {
                "@context": "http://deductions.github.io/drivers.context.jsonld",
                "@type": "http://deductions.github.io/drivers.owl.ttl#Driver",
                "lat": position.coords.latitude,
                "long": position.coords.longitude,
                "timestamp": Math.round(new Date().getTime()),
                "error": ACK
            };
            if (deviceDetector.isMobile) {
                // TODO : Nourrir localStorage lors de l'inscription
                current["@id"] = id;
                // current["@id"] = localStorage.getItem('id');
            }
            if(typeof sessionStorage != 'undefined') {
                sessionStorage.setItem('phileasPosition', JSON.stringify(current));
                console.log('stored');
                console.log(sessionStorage.getItem('phileasPosition'));
            } else {
                console.log("sessionStorage n'est pas supporté");
            }
            resolve(current);
        })
    }

    /**
     * exécutée lorsque les coordonnées GPS n'ont pu être récupérées par l'application
     * @param Geolocation position
     * @return Promise
     */
    this.positionFail = function(err){
        console.log("No GPS")
        console.log(err);
        return new Promise(function (resolve, reject) {
            var current;
            console.log("Erreur de géolocalisation");
            if(typeof sessionStorage != 'undefined') {
                current = JSON.parse(sessionStorage.getItem('phileasPosition'));
                if (current == null) current = {};
                current.error = COORDS_NOT_FOUND;
                if (typeof current.timestamp == 'undefined') {
                    current.lat = DEF_LATITUDE;
                    current.long = DEF_LONGITUDE;
                }
                current.timestamp = Math.round(new Date().getTime());
                sessionStorage.setItem('phileasPosition',JSON.stringify(current));
            } else {
                current = {
                    "@context": "http://deductions.github.io/drivers.context.jsonld",
                    "@type": "http://deductions.github.io/drivers.owl.ttl#Driver",
                    "lat": DEF_LATITUDE,
                    "long": DEF_LONGITUDE,
                    "error": COORDS_NOT_STORED
                };
                if (deviceDetector.isMobile) {
                    current["@id"] = window.id
                }
                console.log("sessionStorage n'est pas supporté");
            }
            reject(current);
        })
    }

    /**
     * Calcul de la distance en kilomètres entre deux points décrits
     * par leurs coordonnées GPS
     * @param Object point1 premier point
     * @param Object point2 second point
     * @return float
     */
    function distance(point1, point2) {
        const RT = 6371;
        const RX = Math.PI / 180;

        var latitude1 = point1.lat * RX;
        var latitude2 = point2.lat * RX;
        var longitude1 = point1.lng * RX;
        var longitude2 = point2.lng * RX;

        return RT * Math.acos(Math.cos(latitude1) * Math.cos(latitude2) * Math.cos(longitude2 - longitude1) + Math.sin(latitude1) * Math.sin(latitude2));
    }

    /**
     * Détection des possibilités du navigateur, puis lance la fonction donnée
     * avec en argument une structure "@id", "lat", "long"
     * @param id id RDF de la personne localisée
     * @param callback
     */
    function gpsPicker (id) {
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
        })
    }

    /**
     * Rafraîchit la carte en enlevant les marqueurs précédents
     */
    function unMark() {
        Pins.markers.map(function(m) {
            trafficMap.removeLayer(m);
        });
        Pins.markers = [];
    }

    /** Pose une marque sur la carte
     * @param point une structure "@id", "lat", "lng"
     */
    function mark(point) {
        if (point['@id']) {
            console.log(point);
            var marker = L.marker([point.lat, point.lng]).addTo(this.trafficMap);
            Pins.markers.push(marker);
                if (point.name) {
                var label = point.name;
            } else {
                var label = point['@id'];
            }
            if (point.error) {
                var msg = "<strong>" + label + "</strong> n’a pas pu être localisé"
            } else {
                var msg = "<strong>"+label+"</strong><br>est ici."
            }
            marker.bindPopup(msg);
            /*L'ouverture du label provoque le déplacement de la carte .openPopup()*/
        }
    }

    /** Rafraîchit l'affichagede la position des chauffeurs à chaque requête
     * @param [Object {"lat", "long"}] points : Coordonnées des points à afficher
     */
    function repaint(points) {
        console.log('refreshing positions');
        console.log(points);
        unMark();
        points.map(function(p) {
            console.log("  point " + p["@id"]);
            mark(p);
        })
    }

    /** Pose une marque sur la carte pour l'extrêmité d'un trajet
     * @param [Object {"lat", "lng"}] point : Coordonnées du point à afficher
     @ @param string type : Départ, Etape ou Arrivée
     */
    function markJourney(point, type) {
        console.log('extrémité : '+type);
        var marker = L.marker([point.lat, point.lng]).addTo(this.trafficMap);
        switch (type) {
            case 'e':
                label = "Etape";
                break;
            case 'a':
                label = "Arrivée";
                break;
            case 'd':
            default:
            label = "Départ";
        }
        var msg = "<strong>"+label+"</strong>";
        /*L'ouverture du label provoque le déplacement de la carte */
        marker.bindPopup(msg).openPopup();
    }

    /** Initialisation de la carte à une position donnée ;
     * @param profil une structure "@id", "lat", "lng"
     */
    function initMap(lat, lng) {
        // console.log(profil);
        this.trafficMap.setView([lat, lng], DEF_ZOOM);
        console.log("Carte recentrée : " + lat + " " + lng);
        var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        var osm = L.tileLayer(osmUrl, {
            attribution: osmAttrib,
            //  maxZoom: 18,
            //  id: 'mapbox.satellite',
            //  accessToken: 'pk.eyJ1IjoibWljaGVsY2FkZW5uZXMiLCJhIjoiY2luZDl6ZzJyMDA1NnZpbTU3aGpjNzQ0eCJ9.Q_E5sqe_rXa9uSuyxeMgBw'
        }).addTo(this.trafficMap);
    }

    /** Initialisation et affichage de la carte du le terminal du chauffeur ;
     * @param profil une structure "@id", "lat", "lng"
     */
     var driverMap = function (profil) {
         return new Promise(function (resolve, reject) {
             if (profil.error == 0) {
                 $('.no-init').css("display", "none");
                 initMap(profil.lat, profil.long);
                 // TODO : Afficher la position de user
                 console.log(profil);
                 mark({
                     "lat": profil.lat,
                     "long": profil.long,
                     "name": profil.name,
                     "@id": profil['@id']
                 });
                 resolve(profil);
             } else {
                 reject("<h1 class='no-init'>Votre terminal est en cours de géo-localisation</h1>")
             }
         })
     }

     this.warning = function (profil) {
         var message = "<h1 class='no-init'>Votre terminal est en cours de géo-localisation</h1>";
         console.log(message);
         if ($(".contenu .no-init").length == 0) { $(".contenu").prepend(message) }
         return new Promise (function (resolve, reject) {
             reject(message)
         })
     }

     function tacet(message) {
         console.log("Echoue silencieusement");
         return {};
     }

    /** Initialisation et affichage de la carte du le terminal du passager ;
     * @param profil une structure "@id", "lat", "lng"
     * @version 1
     */
    function passengerMap(profil) {
      /* jmv: TODO copié-collé
       * position.js:219,237
       * position.js:257,275 */
        return new Promise(function (resolve, reject) {
            if (profil.error == 0) {
                $('.no-init').css("display", "none");
                initMap(profil.lat, profil.long);
                // TODO : Afficher la position de user
                console.log(profil);
                mark({
                    "lat": profil.lat,
                    "long": profil.long,
                    "name": profil.name,
                    "@id": profil['@id']
                });
                resolve(profil);
            } else {
                reject("<h1 class='no-init'>Votre terminal est en cours de géo-localisation</h1>")
            }
        })
    }

    /** Envoi au serveur de la structure "@id", "lat", "lng" ;
     * rafraîchissement de la carte avec les positions reçues des autres personnes
     * @param profil une structure "@id", "lat", "lng"
     */
    function positionneur (profil) {
        console.log(profil);
        x = profil.lat;
        y = profil.lng;
        if (!profil['@id'] || profil.error > 0) {
            var position_data = '{}';
        } else {
            var position_data = JSON.stringify(current);
        }
        console.log("positionneur envoi " + position_data)
        $('#presents').html(Pins.markers.length + " chauffeur(s) en service");
        $('#derniere-update').html((new Date).toLocaleTimeString());
        $('header.entete').css('background-color', COULEURS_ERREURS[profil.error]);
    	$.ajax({
                type: 'POST',
                url:'/position',
                data: position_data,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            }).done(function(json_position) {
                var positions = jQuery.parseJSON(json_position);
                var points = positions['@graph'];
                console.log(points);
                unMark();
                points.map(function(p) {
                    console.log("  point " + p["@id"]);
                    mark(p);
                })
                // console.log(Pins.markers);
            });
    }

    return {
        // "profileur" : function (id, fonction) { return profileur(id, fonction) }
        "me" : this.me,
        "markers" : this.markers,
        "trafficMap" : this.trafficMap,
        "gpsPicker" : function (id, callback) { return profileur(id, callback); },
        "driverMap" : function (profil) { return driverMap(profil); },
        "passengerMap" : function (profil) { return passengerMap(profil); },
        "markJourney" : function (point, type) { return markJourney(point, type); },
        "positionneur" : function (profil) { return positionneur(profil); },
    }
})();
