<?php
require 'vendor/autoload.php';

use Geocoder\Query\GeocodeQuery;

$geocoder = new \Geocoder\ProviderAggregator();

// Setup geocoder adapter.
$adapter  = new \Http\Adapter\Guzzle6\Client();

// Create a chain of providers.
$chain = new \Geocoder\Provider\Chain\Chain(
        array(
            new \Geocoder\Provider\Nominatim\Nominatim($adapter, "http://nominatim.openstreetmap.org/search"),
            new \Geocoder\Provider\FreeGeoIp\FreeGeoIp($adapter, "https://freegeoip.net/json/%s")
        )
);

$geocoder->registerProvider($chain);

// Demo locations
$locations = array(
    array(
        'address' => '82 Avenue Denfert-Rochereau, 75014 Paris',
        'title' => 'Les Grands Voisins',
    ),
    array(
        'address' => '46 Rue René Clair, 75018 Paris',
        'title' => '3W Academy',
    ),
    array(
        'address' => '33 Rue Boinod, 75018 Paris',
        'title' => 'La Piscine',
    )
);

$mapdata = $marker_group = array();

function markerCreator($lat, $long, $label, $key) {
    return "var marker{$key} = L.marker([{$lat}, {$long}]).addTo(map);
    marker{$key}.bindPopup(\"{$label}\");";
}

foreach ($locations as $key => $value) {
    // Try to geocode.
    try {
        $geocode = $geocoder->geocodeQuery(GeocodeQuery::create($value['address']));
        $coordinates = $geocode->first()->getCoordinates();
        $longitude = $coordinates->getLongitude();
        $latitude = $coordinates->getLatitude();

        // Create map data array
        $mapdata[] = markerCreator($latitude, $longitude, $value['title'], $key);

        // Marker grouping array
        $marker_group[] = "marker{$key}";

    } catch (Exception $e) {
        echo $e->getMessage();
    }

}
?>
<!DOCTYPE html>
<html>
<head>
    <title>A simple map with Geocoder PHP and Leaflet.js</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.2.0/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.2.0/dist/leaflet.js"></script>
    <style>
        #map {
            width: 800px;
            height: 400px;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="row">
        <div class="col-lg-12 page-header">
            <h1 id="header">A simple map with Geocoder PHP and Leaflet.js</h1>
        </div>
        <div class="row-fluid">
            <div class="col-lg-8">
                <div id="map"></div>
            </div>
        </div>
    </div><!-- /row -->
</div> <!-- /container -->
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="//netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js"></script>
<script>
    var map = L.map('map');

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>  ',
        maxZoom: 28
    }).addTo(map);

//    L.tileLayer('//{s}.tile.cloudmade.com/41339be4c5064686b781a5a00678de62/998/256/{z}/{x}/{y}.png', {maxZoom: 18}).addTo(map);

    <?php print implode('', $mapdata); ?>

    var group = new L.featureGroup([<?php print implode(', ', $marker_group); ?>]);
    map.fitBounds(group.getBounds());
</script>
</body>
</html>