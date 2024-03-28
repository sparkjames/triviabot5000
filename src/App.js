import { useEffect, useState } from 'react';
// import OpenAI from 'openai';
// import triviaData from './sample-data/trivia-data.json';
import triviaData from './triviabot-cron/triviabot.json';
import './App.scss';
import {ReactComponent as Logo} from './assets/images/Blue-Robot.svg';

function App() {
  // console.log('App start');

  // const [subject, setSubject] = useState( '');
  // const [firstSentence, setFirstSentence] = useState( '' );
  // const [triviaTimestamp, setTriviaTimestamp] = useState( 0 );
  const subject = triviaData.first_sentence_subject;
  const firstSentence = triviaData.first_sentence;
  const triviaTimestamp = triviaData.timestamp;
  
  const [triviaQuestion, setTriviaQuestion] = useState( [] );
  const [triviaAnswer, setTriviaAnswer] = useState( '' );
  const [triviaAnswers, setTriviaAnswers] = useState( [] );
  let [guessesLeft, setGuessesLeft] = useState( 5 );
  let [gotCorrectAnswer, setGotCorrectAnswer] = useState( 0 );
  let [userStats, setUserStats] = useState({
    'gotCorrectAnswer': 0,
    'guessesLeft': 5,
    'triviaAnswers': [],
    'timestamp': Math.floor(Date.now() / 1000),
  });

  let triviaAnswerUnderscores = '';
  for( let i=0; i<subject.length; i++ ){
    if( subject[i] === ' ' ){
      triviaAnswerUnderscores += ' ';
    } else {
      triviaAnswerUnderscores += '_';
    }
    
  }

  // console.log('subject = ', subject);
  // console.log('triviaQuestion = ', triviaQuestion);
  // console.log('triviaAnswers = ', triviaAnswers);

  const main = () => {
    // console.log('ohai');

    // const getTriviaData = async () => {
    //   const res = await fetch('../triviabot-cron/triviabot.json')
    //     .then( (results) => {
    //       console.log('results = ', results);
    //       const json = results.json();
    //       console.log('json = ', json);
    //       return json;
    //     } )
    //     .then( (results) => {
    //       console.log('results = ', results);
    //       setSubject(results.first_sentence_subject);
    //       setFirstSentence(results.first_sentence);
    //       setTriviaTimestamp(results.timestamp);
    //     } );
      
    // }
    // getTriviaData();

    // Check for existing userStats, they might be a return visitor.
    if( localStorage.getItem('userStats') ){
      console.log('localStorage userStats = ', localStorage.getItem('userStats') );
      
      const existingUserStats = JSON.parse( localStorage.getItem('userStats') );
      // console.log( 'existingUserStats = ', existingUserStats );

      // If there were existing userStats in localStorage, AND the timestamp from the trivia question has not surpassed the user's timestamp, that means they are still on the same trivia question as the last time they visited. In other words, the trivia question has been updated yet, so use their existing stats.
      if( triviaTimestamp <= existingUserStats.timestamp ){
        setUserStats( existingUserStats );
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

    // Split the sentence by the subject, so we get an array of the sentence without the subject in it. The empty spot will be filled by the fill the in the blank field (input field).
    const sentenceComponents = firstSentence.split( subject );
    // console.log(sentenceComponents);

    setTriviaQuestion( sentenceComponents );
  };

  const triviaAnswerOnChange = (e) => {
    // console.log(e);
    setTriviaAnswer( e.target.value );
  };

  const triviaFormOnSubmit = (e) => {
    // console.log('form submit');
    // console.log(e);
    e.preventDefault();

    let newUserStats = userStats;

    if( guessesLeft > 0 ){
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
      alert('No more guesses left for today... try again tomorrow!');
    }

    setUserStats(newUserStats);
    localStorage.setItem( 'userStats', JSON.stringify(newUserStats) );

  };

  const triviaAnswerCheckValid = ( submittedAnswer ) => {
    // Remove articles like 'the' and 'a' from the answer and submittedAnswer, gives a little more wiggle room for a correct answer. E.g., if the subject is 'The hooded pitohui', this allows an answer of 'hooded pitohui' to be correct.
    const articlePattern = /^(the\s|a\s)+|(\sthe\s|\sa\s)+|(\sthe|\sa)+$/gi;
    return typeof submittedAnswer === 'string' && typeof subject === 'string'
        ? submittedAnswer.replace( articlePattern, '').localeCompare(subject.replace( articlePattern, ''), undefined, { sensitivity: 'base' }) === 0
        : submittedAnswer === subject;
  };

  // const blanks = () => {
  //   const blankString = triviaData.first_sentence_subject.replace( /[A-Za-z0-9]/g, '_' );
  //   return (
  //     <span class="triviaQuestion-blank">{blankString}</span>
  //   );
  // };

  // Run once on load.
  useEffect( () => {
    main();
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

        <form action="" method="post" className="triviaForm" onSubmit={triviaFormOnSubmit}>

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
                    
                    <span className="triviaAnswer-underscores">{triviaAnswerUnderscores}</span>

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
