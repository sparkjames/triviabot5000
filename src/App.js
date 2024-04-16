import { useEffect, useRef, useState } from 'react';
import SampleTriviaData from './triviabot-cron/api/triviabot.json';
import './App.scss';
import {ReactComponent as Logo} from './assets/images/Blue-Robot.svg';

/**
 * TODO:
 * - text overflows with long answer
 * - better notifications than "alert"
 * - hints in the answer for non-letter/non-number characters
 */

function App() {
  console.log('App start');
  // console.log('SampleTriviaData = ', SampleTriviaData);

  // useRef?

  const [dataIsLoading, setDataIsLoading] = useState(true);

  const triviaData = useRef({
    'subject': 'TriviaBot5000',
    'firstSentence': 'TriviaBot5000 is loading...',
    'timestamp': 0,
  });

  // let userStats = useRef({
  //   'gotCorrectAnswer': 0,
  //   'guessesLeft': 5,
  //   'triviaAnswers': [],
  //   'timestamp': 0,//Math.floor(Date.now() / 1000),
  // });
  let defaultUserStats = {
    'gotCorrectAnswer': 0,
    'guessesLeft': 5,
    'triviaAnswers': [],
    'timestamp': Math.floor(Date.now() / 1000),
  };

  const [triviaQuestion, setTriviaQuestion] = useState( [] );
  const [triviaAnswer, setTriviaAnswer] = useState( '' );
  const [triviaAnswers, setTriviaAnswers] = useState( [] );
  let [guessesLeft, setGuessesLeft] = useState( 5 );
  let [gotCorrectAnswer, setGotCorrectAnswer] = useState( 0 );


  const initTriviaData = () => {
    // console.log('ohai');

    const getTriviaData = async () => {

      let newTriviaData;

      if( window.location.hostname === 'localhost' ){
        setTimeout( () => {
          // console.log('SampleTriviaData = ', SampleTriviaData);
          newTriviaData = {
            'subject': SampleTriviaData.first_sentence_subject,
            'firstSentence': SampleTriviaData.first_sentence,
            'timestamp': SampleTriviaData.timestamp,
          };
          // setTriviaData(newTriviaData);
          handleNewTriviaData(newTriviaData);
          setDataIsLoading(false);
          initUserStats();

        }, 200);

      } else {

        const res = await fetch('https://triviabot5000.com/triviabot5000api/triviabot.json')
          .then( (results) => {
            // console.log('results = ', results);
            const json = results.json();
            // console.log('json = ', json);
            return json;
          } )
          .then( (results) => {
            // console.log('results = ', results);
            newTriviaData = {
              'subject': results.first_sentence_subject,
              'firstSentence': results.first_sentence,
              'timestamp': results.timestamp,
            };
            // setTriviaData(newTriviaData);
            handleNewTriviaData(newTriviaData);
            setDataIsLoading(false);
            initUserStats();

          } );

        }
      
    }
    getTriviaData();
  };


  /**
   * Set the triviaData ref and set states based on that, which should trigger things now that the trivia question set.
   * 
   * @param {*} newTriviaData 
   */
  const handleNewTriviaData = (newTriviaData) => {
    triviaData.current = newTriviaData;

    const sentenceComponents = getTriviaQuestionComponents(newTriviaData);
    setTriviaQuestion( sentenceComponents );
    // console.log('sentenceComponents = ', sentenceComponents);
  };



  /**
   * Check for existing userStats, they might be a return visitor.
   */
  const initUserStats = () => {

    if( localStorage.getItem('userStats') ){
      console.log('localStorage userStats = ', localStorage.getItem('userStats') );
      
      const existingUserStats = JSON.parse( localStorage.getItem('userStats') );
      console.log( 'existingUserStats = ', existingUserStats );

      if( triviaData.current.timestamp > 0 && triviaData.current.timestamp === existingUserStats.timestamp ){
        setGotCorrectAnswer( existingUserStats.gotCorrectAnswer );
        setGuessesLeft( existingUserStats.guessesLeft );
        setTriviaAnswers( existingUserStats.triviaAnswers );

      } else {
        // Otherwise reset the localStorage userStats for the new question.
        // localStorage.setItem( 'userStats', JSON.stringify(defaultUserStats) );
        resetUserStats();
      }

    }

  };



  const resetUserStats = ( newUserStats = {
    triviaAnswers: [],
    guessesLeft: 5,
    gotCorrectAnswer: 0,
    timestamp: triviaData.current.timestamp,
  } ) => {
    if( triviaData.current.timestamp > 0 ){
      localStorage.setItem( 'userStats', JSON.stringify(newUserStats) );
    }
  };



  /**
   * Split the sentence by the subject, so we get an array of the sentence without the subject in it. The empty spot will be filled by the fill the in the blank field (input field).
   * 
   * @param {*} newTriviaData 
   * @returns Array of sentence components.
   */
  const getTriviaQuestionComponents = (newTriviaData) => {
    let sentenceComponents = [];
    // console.log('newTriviaData = ', newTriviaData);

    if( newTriviaData.firstSentence && newTriviaData.subject ){
      sentenceComponents = newTriviaData.firstSentence.split( newTriviaData.subject );

      if( sentenceComponents[0] !== '' && sentenceComponents[1] !== '' ){
        sentenceComponents.splice(1, 0, '');
      }
    }

    // console.log('sentenceComponents = ', sentenceComponents);
    return sentenceComponents;
  };



  /**
   * Set the current trivia answer whenever the user types in the field.
   * 
   * @param {*} e input change event 
   */
  const triviaAnswerOnChange = (e) => {
    let newValue = e.target.value;
    setTriviaAnswer( newValue );
  };



  /**
   * Check if the user has enough guesses left, check if the answer was correct, and update the user's stats.
   * 
   * @param {*} e form submit event
   */
  const triviaFormOnSubmit = (e) => {
    // console.log('form submit');
    // console.log(e);
    e.preventDefault();

    // Do not submit on empty input value.
    if( triviaAnswer === '' ){
      return false;

    } else if( guessesLeft > 0 && !gotCorrectAnswer ){
      setGuessesLeft( guessesLeft - 1 );

      triviaAnswers.push( triviaAnswer );
      setTriviaAnswers( triviaAnswers );

      if( triviaAnswerCheckValid( triviaAnswers[ triviaAnswers.length - 1 ] ) ){
        alert('correct!');
        setGotCorrectAnswer(1);
      } else {
        alert('not correct...');
      }

    } else {
      // no more guesses

      if( gotCorrectAnswer ){
        alert('You already got the correct answer for today!');
      } else {
        alert('No more guesses left for today... try again tomorrow!');
      }
      
    }

  };



  /**
   * Check if the user's answer is correct. Remove articles 
   * like 'the' and 'a' from the answer and submittedAnswer, 
   * gives a little more wiggle room for a correct answer. 
   * E.g., if the subject is 'The hooded pitohui', this 
   * allows an answer of 'hooded pitohui' to be correct.
   * 
   * @param {string} submittedAnswer 
   * @returns {boolean} If the submitted answer is true or false.
   */
  const triviaAnswerCheckValid = ( submittedAnswer ) => {
    const articlePattern = /^(the\s|a\s)+|(\sthe\s|\sa\s)+|(\sthe|\sa)+$/gi;
    return typeof submittedAnswer === 'string' && typeof triviaData.current.subject === 'string'
        ? submittedAnswer.replace( articlePattern, '').localeCompare(triviaData.current.subject.replace( articlePattern, ''), undefined, { sensitivity: 'base' }) === 0
        : submittedAnswer === triviaData.current.subject;
  };



  // Run once on load.
  useEffect( () => {
    // initUserStats();
    initTriviaData();
  }, []);

  useEffect( () => {
    let newUserStats = {};
    newUserStats.triviaAnswers = triviaAnswers;
    newUserStats.guessesLeft = guessesLeft;
    newUserStats.gotCorrectAnswer = gotCorrectAnswer;
    newUserStats.timestamp = triviaData.current.timestamp;
    resetUserStats(newUserStats);
  }, [triviaData, triviaAnswers, guessesLeft, gotCorrectAnswer]);


  return (
    <div className="App">

      <main className="triviaContainer">

        <header className="siteHeader">

          <h1 className="primaryHeading">TriviaBot5000</h1>

          <div className="siteHeader-logo">
            <Logo />
          </div>

        </header>

        <form 
          action="" 
          method="post" 
          className={
            'triviaForm ' + 
            (dataIsLoading? 'triviaForm--is-loading' : '') + 
            (gotCorrectAnswer? 'triviaForm--gotCorrectAnswer' : '')
          } 
          onSubmit={triviaFormOnSubmit}
          >

          <div className="triviaQuestion">

            <div class="triviaQuestion-loadingIndicator"><div></div><div></div><div></div><div></div></div>

            { !dataIsLoading && triviaQuestion.length && triviaQuestion.map( (sentence, index) => {
              if( sentence ){
                return (
                  <span key={index} className="triviaQuestionPart triviaQuestionPart--sentence">{sentence}</span>
                );
              } else {
                return (
                  <span key={index} className="triviaQuestionPart triviaQuestionPart--answer">
                    
                    <label htmlFor="triviaAnswer" className="triviaQuestionLabel">Your answer:</label>
                    
                    <input className="triviaAnswer" id="triviaAnswer" name="triviaAnswer" type="text" placeholder='Type answer here&hellip;' onChange={triviaAnswerOnChange} />
                    
                    <span className="triviaAnswer-underscores">{triviaData?.current?.subject && triviaData.current.subject.split('').map( letter => letter === ' ' || letter === '-' ? letter : '_' ) }</span>

                  </span>
                );
              }
            })}

          </div>
          
          <footer className="triviaFormFooter">
            <button className="triviaFormSubmit" type="submit" disabled={gotCorrectAnswer || dataIsLoading}>Check answer</button>

            <p className="triviaMeta">
              You have <span className="triviaGuessesLeft">{guessesLeft}</span> guesses left.
            </p>
          </footer>

          { triviaAnswers && triviaAnswers.length > 0 && 
          <ol className="triviaAnswerList"> 
            {triviaAnswers.map( (thisAnswer, i) => {
              return (
                <li key={i} className="triviaAnswerItem">{thisAnswer}</li>
              );
            })}
          </ol>
          }

        </form>

      </main>
      
    </div>
  );
}

export default App;
