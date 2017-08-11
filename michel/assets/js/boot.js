/** jmv: TODO description module */
var Boot = (function () {
    this.personalKey = null;
    this.whois = {
        "pseudo": "me"
    };

    function getIdentity () {
        this.personalKey = localStorage.getItem('personalKey');

        if (typeof personalKey != 'undefined') {
            this.whois = localStorage.getItem('whoami');
        }
    }

    return {
        "personalKey": this.personalKey,
        "whois": this.whois,
        "getIdentity": function () { return getIdentity() }
    }
})()
