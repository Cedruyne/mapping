var Adresses = (function () {
    this.addressServer = 'http://api-adresse.data.gouv.fr/search/?';
    this.reverseServer = 'http://api-adresse.data.gouv.fr/reverse/?';
    this.waypoints = {
        "depart": null,
        "etapes": [],
        "arrivee": null
    };
    this.summary = {};
    this.control = L.Routing.control( {
        routeWhileDragging: true,
        show: false
    });
    this.control.on('routesfound', function(event) {
        var routes = event.routes;
        // console.log(routes);
        let steps = Adresses.control.getWaypoints();
        Adresses.waypoints.depart = steps.shift();
        Adresses.waypoints.arrivee = steps.pop();
        Adresses.waypoints.etapes = steps;
        console.log(Adresses.waypoints);
        Adresses.summary = routes[0].summary;
        $('#distance-estimee').text(Math.floor(Adresses.summary.totalDistance/10)/100+" km")
        // $('#form-request').append("<p>Temps estimé : "+Math.floor(Adresses.summary.totalTime/60)+" minutes</p>")
    });


    /** Suggestion d'une adresse en fonction de fragments de texte saisis ;
     * Utilisation du service public BANO
     * Version jQuery (reste problématique)
     * @param string fragment : fragment de texte saisi par l'utilisateur
     * @param string liste : id CSS du widget qui contient l'adresse saisie
     */
    function suggest(fragment, liste) {
        $.ajax({
            type: 'GET',
            url: this.addressServer + "q=" + fragment + "&limit=10",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                // 'Access-Control-Request-Method': 'GET',
                // 'Access-Control-Request-Headers': 'X-PINGOTHER',
                // 'X-PINGOTHER': 'pingpong',
            },
        }).done(function(json_response) {
            let reponse = jQuery.parseJSON(json_response);
            console.log(reponse.features);
            let suggestions = $('#'+liste);
            suggestions.empty();
            reponse.features.forEach(function (lieu) {
                let adresse = $('<option value="'+ lieu.properties.label +'"/>');
                suggestions.append(adresse);
            })
        })
    }

    /** Utilitaire pour créer un objet XMLHttpRequest compatible avec CORS ;
     * @param string method : méthode HTTP utilisée
     * @param string url : URL cible de la requête
     * @return [Object XMLHttpRequest]
     */
    var createCORSRequest = function(method, url) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            xhr.open(method, url, true);
            // Most browsers.
        } else if (typeof XDomainRequest != "undefined") {
            // IE8 & IE9
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            // CORS not supported.
            xhr = null;
        }
        return xhr;
    }

    /**
 * Affiche un marqueur pour signaler une étape sur la carte
 * @param string lat : latitude
 * @param string lng : longitude
 * @param string etape : classe d'étape (départ, arrivée, ou étape intermédiaire)
 * @version 1.0
 */
function markEtape(lat, lng, etape) {
    Pins.markJourney({"lat": lat, "lng": lng}, etape);

    if ($("#adresse-depart").data('lat') && $("#adresse-arrivee").data('lat')) {
        L.Routing.control({
            waypoints: [
                L.latLng($("#adresse-depart").data('lat'), $("#adresse-depart").data('lng')),
                L.latLng($("#adresse-arrivee").data('lat'), $("#adresse-arrivee").data('lng'))
            ],
            routeWhileDragging: true
        }).addTo(Pins.trafficMap);
    }
}

/**
     * Affiche un marqueur pour signaler une étape sur la carte
     * @param string lat : latitude
     * @param string lng : longitude
     * @param string etape : classe d'étape (départ, arrivée, ou étape intermédiaire)
     * @version 1.0
     */
    function showItenerary() {
        var trajet = [];
        if (Adresses.waypoints.depart != null) {
            trajet.push(Adresses.waypoints.depart);
        };
        if (Adresses.waypoints.etapes.length > 0) {

        };
        if (Adresses.waypoints.arrivee != null) {
            trajet.push(Adresses.waypoints.arrivee);
        }
        Adresses.control.setWaypoints(trajet);
        console.log(Adresses.control);
        Adresses.control.addTo(Pins.trafficMap);
        console.log('Trajet composé');
    }

    /** Suggestion d'une adresse en fonction de fragments de texte saisis ;
     * Utilisation du service public BANO
     * Version Vanilla JS
     * @param string fragment : fragment de texte saisi par l'utilisateur
     * @param string liste : id CSS du widget qui contient l'adresse saisie
     */
    function suggestXHR (fragment, liste) {
        return new Promise(function (resolve, reject) {
            var url = 'http://api-adresse.data.gouv.fr/search/?q='+fragment+"&limit=10";
            var method = 'GET';
            var xhr = createCORSRequest(method, url);
            xhr.onload = function(event) {
                if (this.status == 200) {
                    this.response.widget = liste
                    resolve(jQuery.parseJSON(this.response))
                } else {
                    reject(Error(req.statusText));
                }
            };

            xhr.onerror = function() {
                // Error code goes here.
            };

            xhr.send();
        })
    }

    /** Construction d'un widget de listes d'adresses ;
     * @param [Object {}] reponse : liste d'adresses au format BANO
     * @param string liste : id de l'input de saie de l'adresse
     */
    function suggestionsBuild (reponse) {
        console.log(reponse.features);
        console.log(document.activeElement);
        let suggestions = $('#'+$(document.activeElement).attr('list'));
        suggestions.empty();
        reponse.features.forEach(function (lieu) {
            let coordinates = lieu.geometry.coordinates;
            console.log(coordinates);
            let lat = lieu.geometry.coordinates[1];
            let lng = lieu.geometry.coordinates[0];
            console.log(lat+ " "+lng);
            let adresse = $('<li class="location-suggestion" data-lat="' + lat +'" data-lng="' + lng +'">'+ lieu.properties.label +'</li>');
            suggestions.append(adresse);
        })
    }

    /** Suggestion d'une adresse en fonction des coordonnées GPS ;
     * Utilisation du service public BANO
     * @param [Object {"lat": "", "lng":""}] position : Coordonnées du point à identifier
     */
    function addressXHR (position) {
        console.log(position);
        return new Promise(function (resolve, reject) {
            var url = 'http://api-adresse.data.gouv.fr/reverse/?lon='+position.lng+'&lat='+ position.lat;
            var method = 'GET';
            var xhr = createCORSRequest(method, url);

            xhr.onload = function(event) {
                if (this.status == 200) {
                    resolve(jQuery.parseJSON(this.response))
                } else {
                    reject(Error(req.statusText));
                }
            };

            xhr.onerror = function(event) {
                reject(Error("Erreur réseau"));
            };

            xhr.send();
        })
    }

    function rideStep(point) {
        point = L.latLng(point.lat, point.lng);
        console.log(point);

    }

    function fromThere(reponse) {
        window.inputHasFocus = $("#adresse-depart");
        stepComplete(reponse);
    }

    function stepComplete (reponse) {
        sessionStorage.setItem('rideStatus', Dialog.PREPARING_REQUEST)
        let adresse = reponse.features[0];
        let focus = window.inputHasFocus;
        widgetID = focus.prop('id');
        point = L.latLng(adresse.geometry.coordinates[1], adresse.geometry.coordinates[0]);
        console.log(point);
        this.waypoints[widgetID.slice(8)] = point;
        console.log(this.waypoints);
        focus.val(adresse.properties.label);
        focus.data('lat', adresse.geometry.coordinates[1]);
        focus.data('lng', adresse.geometry.coordinates[0]);
        Pins.trafficMap.setView([adresse.geometry.coordinates[1],adresse.geometry.coordinates[0]], 15);
        showItenerary();
        console.log('Done');
        window.inputHasFocus = $("#adresse-arrivee");
        console.log(window.inputHasFocus);
    }

    function suggestGPS (adresse) {

    }

    return {
        "control": this.control,
        "waypoints": this.waypoints,
        "summary": this.summmary,
        "suggest" : function (fragment, liste) { return suggestXHR(fragment, liste).then(suggestionsBuild, alert); },
        "address" : function (position) { return addressXHR(position).then(stepComplete, alert); },
        "fromThere" : function (position) { return addressXHR(position).then(fromThere, alert); },
        "markEtape" : function (lat, lng, etape) { return markEtape(lat, lng, etape); },
        // jmv TODO ? stepComplete
    }
})();
