<?php
require 'vendor/autoload.php';

use Geocoder\Query\GeocodeQuery;

$geocoder = new \Geocoder\ProviderAggregator();

// Setup geocoder adapter.
$adapter  = new \Http\Adapter\Guzzle6\Client();

// Create a chain of providers.
// Be sure to include my previously created adapter.
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
        'address' => '3324 N California Ave, Chicago, IL, 60618',
        'title' => 'Hot Dougs',
    ),
    array(
        'address' => '11 S White, Frankfort, IL, 60423',
        'title' => 'Museum',
    ),
    array(
        'address' => '1000 Sterling Ave, , Flossmoor, IL, 60422',
        'title' => 'Library',
    ),
    array(
        'address' => '2053 Ridge Rd, Homewood, IL, 60430',
        'title' => 'Twisted Q',
    )
);

foreach ($locations as $key => $value) {
    // Try to geocode.
    try {
        $geocode = $geocoder->geocodeQuery(GeocodeQuery::create($value['address']));
        $coordinates = $geocode->first()->getCoordinates();
        // var_dump($coordinates);

    } catch (Exception $e) {
        echo $e->getMessage();
    }
}

$resultat = $geocoder->geocode($_SERVER['REMOTE_ADDR']);
$city = $geocode->first()->getLocality();
var_dump($city);

?>
<!DOCTYPE html>
<html>
<head>
    <title>A simple map with Geocoder PHP and Leaflet.js</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css">
</head>
<body>
<div class="container">
    <div class="row">
        <div class="col-lg-12 page-header">
            <h1 id="header">A simple map with Geocoder PHP and Leaflet.js</h1>
        </div>
        <div class="row-fluid">
            <div class="col-lg-8">

            </div>
        </div>
    </div><!-- /row -->
</div> <!-- /container -->
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="//netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js"></script>
</body>
</html>