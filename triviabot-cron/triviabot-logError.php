<?php

function triviabot_logError( $error_message='' ){
	$new_log = "\n\r";
	$new_log .= "____________________\n\r";
	$new_log .= "Date: " . date("Y-m-d H:i:s") . "\r\n";
	$new_log .= $error_message;
	$new_log .= "\n\r";

	file_put_contents( 'triviabot-errors.log', $new_log, FILE_APPEND );
}
