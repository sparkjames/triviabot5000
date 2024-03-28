<?php
/**
 * This file gets run on a cron job.
 */

if( file_exists('triviabot-config.php') ){
	require_once 'triviabot-config.php';
}
require_once 'triviabot-fetch.php';
require_once 'triviabot-updateStats.php';
require_once 'triviabot-logError.php';

try {

	$wikimedia_force = 0;
	$force = 0;

	$stats = json_decode( file_get_contents( 'triviabot-stats.json' ), true );
	if( isset($stats['wikimedia']) && isset($stats['openai']) ):

		$now = new DateTime('now');

		// Check status of Wikimedia fetch.
		$wikimedia_hasError = $stats['wikimedia']['hasError'];

		$wikimedia_lastCheck = new DateTime($stats['wikimedia']['lastCheck']);
		$wikimedia_lastSuccess = new DateTime($stats['wikimedia']['lastSuccess']);

		$wikimedia_nextCheck = new DateTime($stats['wikimedia']['lastCheck']);
		$wikimedia_nextCheck->modify('+1 hour');

		$wikimedia_nextSuccess = new DateTime($stats['wikimedia']['lastSuccess']);
		$wikimedia_nextSuccess->modify('+1 day');

		// If it's been 1 day since the last successful run, or there was an error and it's been 1 hour since the last check...
		if( $wikimedia_force || ($now > $wikimedia_nextSuccess) || ($wikimedia_hasError && $wikimedia_now > $wikimedia_nextCheck) ){
			// ... do the Wikimedia api fetch.
			
			// Do the Wikimedia fetch, get the featured articles from one year ago.
			$wikimedia_endpoint = 'feed/v1/wikipedia/en/featured/' . date( 'Y/m/d', strtotime( '-1 year') );
			$response = triviabot_fetch_from_wikimedia( $wikimedia_endpoint );

			if( $response ){
				$json_response = json_decode( $response, true );
				if( 
					$json_response && 
					(isset($json_response['tfa']['extract']) && $json_response['tfa']['extract']) ||
					(isset($json_response['mostread']['articles'][0]['extract']) && $json_response['mostread']['articles'][0]['extract'])
				){
  				file_put_contents( 'triviabot-wikipedia.json', $response );
					
					// Update stats with successful fetch.
					$stats['wikimedia']['lastSuccess'] = date('Y-m-d H:i:s');
					$stats['wikimedia']['hasError'] = 0;
				} else {
					$stats['wikimedia']['hasError'] = 1;
					triviabot_logError($response);
				}
			}

		}

		// update lastCheck
		$stats['wikimedia']['lastCheck'] = date('Y-m-d H:i:s');


		// Check status of OpenAI fetch.
		$openai_hasError = $stats['openai']['hasError'];

		$openai_lastCheck = new DateTime($stats['openai']['lastCheck']);
		$openai_lastSuccess = new DateTime($stats['openai']['lastSuccess']);

		$openai_nextCheck = new DateTime($stats['openai']['lastCheck']);
		$openai_nextCheck->modify('+1 hour');

		$openai_nextSuccess = new DateTime($stats['openai']['lastSuccess']);
		$openai_nextSuccess->modify('+1 day');

		// If it's been 1 day since the last successful run, or there was an error and it's been 1 hour since the last check...
		if( $force || ($now > $openai_nextSuccess) || ($openai_hasError && $openai_now > $openai_nextCheck) ){
			// ... do the OpenAI fetch.
			if( file_exists('triviabot-wikipedia.json') ){
				$triviabot_wikipedia_json = json_decode( file_get_contents('triviabot-wikipedia.json'), true );

				$extract = false;
				if( $triviabot_wikipedia_json && isset($triviabot_wikipedia_json['tfa']['extract']) ){
					// Get extract from Today's Featured Article (tfa).
					$extract = $triviabot_wikipedia_json['tfa']['extract'];

				} elseif( $triviabot_wikipedia_json && isset($triviabot_wikipedia_json['mostread']['articles'][0]['extract']) ){
					// Get extract from the first "most read" article in the list.
					$extract = $triviabot_wikipedia_json['mostread']['articles'][0]['extract'];
				}

				if( $extract ){
					$response = triviabot_fetch_from_ai( $extract );

					if( $response ){
						$json_response = json_decode( $response, true );
						if( isset($json_response['choices'][0]['message']['content']) && json_decode($json_response['choices'][0]['message']['content'], true) ){
							// $new_triviabot_data = json_decode($json_response['choices'][0]['message']['content'], true);
							// $new_triviabot_data['timestamp'] = time();
							file_put_contents( 'triviabot.json', $json_response['choices'][0]['message']['content'] );
							
							// Update stats with successful fetch.
							$stats['openai']['lastSuccess'] = date('Y-m-d H:i:s');
							$stats['openai']['hasError'] = 0;
						} else {
							$stats['openai']['hasError'] = 1;
							triviabot_logError($response);
						}
						
					}
				}

			}

		}

		// update lastCheck
		$stats['openai']['lastCheck'] = date('Y-m-d H:i:s');

		triviabot_updateStats( json_encode($stats) );

	endif;

} catch (Exception $e) {
	triviabot_logError( 'PHP Error: ' . $e->getMessage() );
}
