<?php

function triviabot_updateStats( $json='{}' ){

	if( is_array($json) ){
		$json = json_encode($json);
	}

	if( json_decode($json, true) ){
		file_put_contents( 'triviabot-stats.json', $json );
	}

}
