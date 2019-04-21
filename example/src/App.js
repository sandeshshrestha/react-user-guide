import React, { Component } from 'react';
import UserGuide from 'react-user-guide';

const style = {
  width: '20vw',
  backgroundColor: 'grey',
  marginTop: '30vh',
  marginLeft: '40vw',
  padding: 5
};

const guides = [
  {
    querySelector: '.unique-classname',
    position: 'east',
    title: 'First',
    message: 'User guide position \'east\''
  },
  {
    querySelector: '.unique-classname',
    position: 'west',
    title: 'Second',
    message: 'User guide position \'west\''
  },
  {
    querySelector: '.unique-classname',
    position: 'north',
    title: 'Third',
    message: 'User guide position \'north\''
  },
  {
    querySelector: '.unique-classname',
    tooltipWidth: 500,
    position: 'south',
    title: 'Forth',
    message: 'User guide position \'south\', with custom width'
  }
];

export default class App extends Component {
  render () {
    return (
      <UserGuide guides={guides}>
        <div style={style} className="unique-classname">Target element</div>
      </UserGuide>
    )
  }
}
