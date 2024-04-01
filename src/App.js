import { useEffect, useRef, useState } from 'react';
import SampleTriviaData from './triviabot-cron/api/triviabot.json';
import './App.scss';
import {ReactComponent as Logo} from './assets/images/Blue-Robot.svg';

function App() {
  console.log('App start');
  // console.log('SampleTriviaData = ', SampleTriviaData);

  // useRef?

  const [dataIsLoading, setDataIsLoading] = useState(true);

  const triviaData = useRef({
    'subject': 'TriviaBot5000',
    'firstSentence': 'TriviaBot5000 is loading...',
    'triviaTimestamp': 0,
  });

  let userStats = useRef({
    'gotCorrectAnswer': 0,
    'guessesLeft': 5,
    'triviaAnswers': [],
    'timestamp': Math.floor(Date.now() / 1000),
  });
  console.log('userStats = ', userStats);

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
          console.log('SampleTriviaData = ', SampleTriviaData);
          newTriviaData = {
            'subject': SampleTriviaData.first_sentence_subject,
            'firstSentence': SampleTriviaData.first_sentence,
            'triviaTimestamp': SampleTriviaData.timestamp,
          };
          // setTriviaData(newTriviaData);
          handleNewTriviaData(newTriviaData);
          setDataIsLoading(false);

        }, 200);

      } else {

        const res = await fetch('https://triviabot5000.com/triviabot5000api/triviabot.json')
          .then( (results) => {
            console.log('results = ', results);
            const json = results.json();
            console.log('json = ', json);
            return json;
          } )
          .then( (results) => {
            console.log('results = ', results);
            newTriviaData = {
              'subject': results.first_sentence_subject,
              'firstSentence': results.first_sentence,
              'triviaTimestamp': results.timestamp,
            };
            // setTriviaData(newTriviaData);
            handleNewTriviaData(newTriviaData);
            setDataIsLoading(false);

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
    console.log('sentenceComponents = ', sentenceComponents);

  };

  /**
   * Set the current trivia answer whenever the user types in the field.
   * 
   * @param {*} e input change event 
   */
  const triviaAnswerOnChange = (e) => {
    // console.log(e);
    setTriviaAnswer( e.target.value );
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

    let newUserStats = userStats.current;

    if( guessesLeft > 0 && !gotCorrectAnswer ){
      setGuessesLeft( guessesLeft - 1 );
      newUserStats.guessesLeft = guessesLeft - 1;

      triviaAnswers.push( triviaAnswer );
      setTriviaAnswers( triviaAnswers );
      newUserStats.triviaAnswers = triviaAnswers;

      if( triviaAnswerCheckValid( triviaAnswers[ triviaAnswers.length - 1 ] ) ){
        alert('correct!');
        setGotCorrectAnswer(1);
        newUserStats.gotCorrectAnswer = 1;
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

    // setUserStats(newUserStats);
    userStats.current = newUserStats;
    localStorage.setItem( 'userStats', JSON.stringify(newUserStats) );

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



  /**
   * Check for existing userStats, they might be a return visitor.
   */
  // useEffect( () => {
  const initUserStats = () => {
    if( localStorage.getItem('userStats') ){
      console.log('localStorage userStats = ', localStorage.getItem('userStats') );
      
      const existingUserStats = JSON.parse( localStorage.getItem('userStats') );
      // console.log( 'existingUserStats = ', existingUserStats );

      // If there were existing userStats in localStorage, AND the timestamp from the trivia question has not surpassed the user's timestamp, that means they are still on the same trivia question as the last time they visited. In other words, the trivia question has been updated yet, so use their existing stats.
      if( triviaData.current.triviaTimestamp <= existingUserStats.timestamp ){
        userStats.current = existingUserStats;
        setGotCorrectAnswer( existingUserStats.gotCorrectAnswer );
        setGuessesLeft( existingUserStats.guessesLeft );
        setTriviaAnswers( existingUserStats.triviaAnswers );

      // Otherwise reset the localStorage userStats for the new question.
      } else {
        localStorage.setItem( 'userStats', JSON.stringify(userStats) );
      }

    // Set the localStorage userStats for the first time.
    } else {
      localStorage.setItem( 'userStats', JSON.stringify(userStats) );
    }
  // }, [triviaData]);
  };

  /**
   * Split the sentence by the subject, so we get an array of the sentence without the subject in it. The empty spot will be filled by the fill the in the blank field (input field).
   * 
   * @param {*} newTriviaData 
   * @returns Array of sentence components.
   */
  const getTriviaQuestionComponents = (newTriviaData) => {
    let sentenceComponents = [];
    console.log('newTriviaData = ', newTriviaData);

    if( newTriviaData.firstSentence && newTriviaData.subject ){
      sentenceComponents = newTriviaData.firstSentence.split( newTriviaData.subject );
      // console.log(sentenceComponents);
      // setTriviaQuestion( sentenceComponents );
    }

    console.log('sentenceComponents = ', sentenceComponents);
    return sentenceComponents;
  };

  // Run once on load.
  useEffect( () => {
    initUserStats();
    initTriviaData();
  }, []);


  return (
    <div className="App">

      <main className="triviaContainer">

        <header className="siteHeader">

          <h1 className="primaryHeading">TriviaBot5000</h1>

          <div className="siteHeader-logo">
            <Logo />
          </div>

        </header>

        <form action="" method="post" className={'triviaForm ' + dataIsLoading? 'triviaForm--is-loading' : '' } onSubmit={triviaFormOnSubmit}>

          <div className="triviaQuestion">

            { triviaQuestion.length && triviaQuestion.map( (sentence, index) => {
              if( sentence ){
                return (
                  <span key={index} className="triviaQuestionPart triviaQuestionPart--sentence">{sentence}</span>
                );
              } else {
                return (
                  <span key={index} className="triviaQuestionPart triviaQuestionPart--answer">
                    
                    <label htmlFor="triviaAnswer" className="triviaQuestionLabel">Your answer:</label>
                    
                    <input className="triviaAnswer" id="triviaAnswer" name="triviaAnswer" type="text" placeholder='Type answer here&hellip;' onChange={triviaAnswerOnChange} />
                    
                    <span className="triviaAnswer-underscores">{triviaData?.current?.subject && triviaData.current.subject.split('').map( letter => letter === ' ' ? ' ' : '_' ) }</span>

                  </span>
                );
              }
            })}

          </div>
          
          <footer className="triviaFormFooter">
            <button className="triviaFormSubmit" type="submit">Check answer</button>

            <p className="triviaMeta">
              You have <span className="triviaGuessesLeft">{guessesLeft}</span> guesses left.
            </p>
          </footer>

          { triviaAnswers.length > 0 && 
          <ol className="triviaAnswerList"> 
            {triviaAnswers.map( (thisAnswer) => {
              return (
                <li className="triviaAnswerItem">{thisAnswer}</li>
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
