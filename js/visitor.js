var Visitor = (function () {

    /** Initialisation et affichage de la carte du visiteur ;
     * @param profil une structure "lat", "lng"
     * @version 1
     */
    this.visitorMap = function(profil) {
        return new Promise(function (resolve, reject) {
            if (profil.error == 0) {
                $('.no-init').css("display", "none");
                Pins.initMap(profil.lat, profil.long);
                // TODO : Afficher la position de user
                console.log(profil);
                mark({
                    "lat": profil.lat,
                    "long": profil.long
                });
                resolve(profil);
            } else {
                reject("<h1 class='no-init'>Vous êtes en cours de géo-localisation</h1>");
            }
        });
    };

    return {
        "visitorMap": this.visitorMap
    };

})();
