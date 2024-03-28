<?php

/**
 * Use OpenAI API to form a trivia question based on the Wikipedia data. Save the reponse to the file triviabot.json.
 *
 * @return string|bool The response from the request, or false on failure.
 */
function triviabot_fetch_from_ai( $content ){
  $curl = curl_init();

  $postfields = '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful trivia assistant designed to output JSON."
      },
      {
        "role": "user",
        "content": "Determine the subject of the first sentence of the extract in the following message."
      },
      {
        "role": "user",
        "content": "' . str_replace( '"', '\"', $content ) . '"
      },
      {
        "role": "assistant",
        "content": ""
      },
      {
        "role": "user",
        "content": "Output the first sentence, the subject of the first sentence, and a unix epoch timestamp as json with the keys \"first_sentence\", \"fist_sentence_subject\", and \"timestamp\"."
      }
    ],
    "temperature": 1,
    "max_tokens": 256,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0
  }';
  // echo '<pre class="">$postfields = '; print_r($postfields); echo '</pre>'; die('ohai');
  // "content": "Output the first sentence and the subject of the first sentence as json with the keys \"first_sentence\" and \"fist_sentence_subject\"."

  curl_setopt_array($curl, array(
    CURLOPT_URL => 'https://api.openai.com/v1/chat/completions',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => $postfields, // JSON_UNESCAPED_SLASHES
    CURLOPT_HTTPHEADER => array(
      'Content-Type: application/json',
      'Authorization: ' . OPENAI_BEARER_TOKEN,
    ),
  ));

  // triviabot_logError('$postfields = ' . $postfields);

  $response = curl_exec($curl);
  curl_close($curl);

  return $response;

}



/**
 * Use Wikimedia API to fetch Wikipedia featured article data and save it to a file triviabot-wikipedia.json, which will be used later by the OpenAI API.
 *
 * @return string|bool The response from the request, or false on failure.
 */
function triviabot_fetch_from_wikimedia( $endpoint ){
  $curl = curl_init();

  $endpoint_url = 'https://api.wikimedia.org/' . ltrim( $endpoint, '/' );

  curl_setopt_array($curl, array(
    CURLOPT_URL => $endpoint_url,//'feed/v1/wikipedia/en/featured/2016/05/17',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'GET',
    CURLOPT_HTTPHEADER => array(
      'Authorization: ' . WIKIMEDIA_BEARER_TOKEN
    ),
  ));

  $response = curl_exec($curl);
  curl_close($curl);

  return $response;
}
