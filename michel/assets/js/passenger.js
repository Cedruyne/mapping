var Passenger = (function () {

    /** Initialisation et affichage de la carte du le terminal du passager ;
     * @param profil une structure "@id", "lat", "lng"
     * @version 1
     */
    this.passengerMap = function(profil) {
        return new Promise(function (resolve, reject) {
            if (profil.error == 0) {
                $('.no-init').css("display", "none");
                Pins.initMap(profil.lat, profil.long);
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

    /**
     * Envoir d'une demande de course au serveur
     * @return Promise : requête asynchrone encapsulant la requête XMLHttpRequest
     */
    function rideSubmit ()  {
        return new Promise(function (resolve, reject) {
            let id = localStorage.getItem('personalKey');
            $("#form-request").remove();
            request_data = {
                "@context": "http://deductions.github.io/drivers.context.jsonld",
                // "@id": window.id,
                "@type": "RideEnquiry" ,
                "from" : id,
                "vehiculeType": "http://dbpedia.org/resource/" + $('[name="vehicleType"]').val(),
                "departure": {
                    "lat":$('#adresse-depart').data('lat'),
                    "long": $('#adresse-depart').data('lng'),
                },
                "destination": {
                    "lat":$('#adresse-arrivee').data('lat'),
                    "long": $('#adresse-arrivee').data('lng'),
                },
                "datetime": (new Date).toLocaleTimeString(),
            };
            console.log(request_data);
            $.ajax({
                type: 'POST',
                url:'/passenger',
                data: JSON.stringify(request_data),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            }).done(function(response_data) {
                console.log(response_data);
                resolve(response_data);
            }).fail(function(err) {
                reject;
            }).always(function() {
                Dialog.listen();
            });
            window.passengerStatus = status.SUBMITTED_RIDE;
            sessionStorage.setItem('passengerStatus', status.SUBMITTED_RIDE)
        })

    }

    function rideAnswer() {
        console.log("Demande de course prise en compte");
        window.passengerStatus = status.PENDING_RIDE;
        sessionStorage.setItem('passengerStatus', window.status.PENDING_RIDE)
        // Dialog.listen();
    }

    function RideEnquiry_2 (message) {
        alert('Un chauffeur a acceptée la course')
        window.passengerStatus = status.ACCEPTED_RIDE;
        sessionStorage.setItem('passengerStatus', status.ACCEPTED_RIDE)
    }

    return {
        "passengerMap": this.passengerMap,
        "rideBook" : function () { return rideSubmit().then(rideAnswer); }
    }

})();
