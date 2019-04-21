import React, { Component, Fragment } from 'react';
import debounce from 'lodash.debounce';
import PropTypes from 'prop-types';
import styles from './styles.scss';

const win = window;
const createElement = (type, className = '', html = '') => {
  const newDiv = document.createElement(type);

  newDiv.className = className;
  newDiv.innerHTML = html;

  return newDiv;
};
const removeElement = element => {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
};
const applyStyle = (el, style = {}) => {
  const dom = el;

  Object.keys(style).forEach(key => {
    dom.style[key] = style[key];
  });

  return dom;
};

class HelpText extends Component {
  static propTypes = {
    querySelector: PropTypes.string,
    tooltipWidth: PropTypes.number,
    title: PropTypes.string,
    message: PropTypes.string,
    position: PropTypes.string, // east, west, north, south
    onNext: PropTypes.func,
    onSkip: PropTypes.func,
    isLast: PropTypes.bool.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.element,
      PropTypes.string,
    ]),
  }

  static defaultProps = {
    tooltipWidth: 240,
    position: 'north',
    isLast: false
  }

  constructor(props) {
    super(props);

    this.debouncedApplyStyleToCurrentNode = debounce(this.applyStyleToCurrentNode.bind(this), 10);
    this.mask = createElement('div', `userGuide--mask ${styles.userGuideMask}`);
  }

  componentDidMount() {
    this.showHelp();
    win.addEventListener('resize', this.debouncedApplyStyleToCurrentNode);
  }

  componentDidUpdate() {
    this.showHelp();
  }

  componentWillUnmount() {
    this.removeResizeListener();
  }

  removeResizeListener() {
    win.removeEventListener('resize', this.debouncedApplyStyleToCurrentNode);
  }

  getNode() {
    const {
      title,
      message,
      onNext,
      onSkip,
      position,
      tooltipWidth,
      isLast,
    } = this.props;

    const node = createElement('span', `userGuide--message ${styles.userGuideMessage} ${styles[`userGuideMessage${position}`]}`, '');
    const titleEl = createElement('h3', styles.userGuideMessageTitle, title);
    const messageEl = createElement('p', styles.userGuideMessageBody, message);
    const nextButton = createElement('button', isLast ? 'finish' : 'next', isLast ? 'Finish' : 'Next');

    nextButton.addEventListener('click', onNext);

    node.appendChild(titleEl);
    node.appendChild(messageEl);

    if (!isLast) {
      const skipButton = createElement('button', 'skip', 'Skip');

      skipButton.addEventListener('click', onSkip);
      node.appendChild(skipButton);
    }
    node.appendChild(nextButton);

    return applyStyle(node, {
      width: `${tooltipWidth}px`,
    });
  }

  applyStyleToCurrentNode() {
    if (this.helpNeededDOM && this.node) {
      const {
        position,
      } = this.props;

      const {
        top: helpNeededElTop,
        left: helpNeededElLeft,
        width: helpNeededElWidth,
        height: helpNeededElHeight,
      } = this.helpNeededDOM.dom.getBoundingClientRect();

      // Add style.top after append, so we can get height of the node
      const { height: nodeHeight, width: nodeWidth } = this.node.getBoundingClientRect();
      const nodeMargin = 10;

      switch (position) {
      case 'east':
        this.node = applyStyle(this.node, {
          left: `${nodeMargin + helpNeededElLeft + helpNeededElWidth}px`,
          top: `${helpNeededElTop + (helpNeededElHeight / 2 - nodeHeight / 2)}px`,
        });
        break;
      case 'west':
        this.node = applyStyle(this.node, {
          left: `${helpNeededElLeft - nodeWidth - nodeMargin}px`,
          top: `${helpNeededElTop + (helpNeededElHeight / 2 - nodeHeight / 2)}px`,
        });
        break;
      case 'north':
        this.node = applyStyle(this.node, {
          left: `${helpNeededElLeft + (helpNeededElWidth / 2 - nodeWidth / 2)}px`,
          top: `${helpNeededElTop - nodeHeight - nodeMargin}px`,
        });
        break;
      case 'south':
        this.node = applyStyle(this.node, {
          left: `${helpNeededElLeft + (helpNeededElWidth / 2 - nodeWidth / 2)}px`,
          top: `${helpNeededElTop + helpNeededElHeight + nodeMargin}px`,
        });
        break;

      default:
        break;
      }
    }
  }

  showHelp() {
    // Reset original style
    if (this.helpNeededDOM) {
      this.helpNeededDOM.dom.style.position = this.helpNeededDOM.position;
      this.helpNeededDOM.dom.style.zIndex = this.helpNeededDOM.zIndex;
      delete this.helpNeededDOM;
    }

    const { querySelector, onNext } = this.props;

    if (querySelector) {
      const helpNeededDOM = document.querySelector(querySelector);

      if (helpNeededDOM) {
        // Save it so we can reset the style
        this.helpNeededDOM = {
          dom: helpNeededDOM,
          position: helpNeededDOM.style.position,
          zIndex: helpNeededDOM.style.zIndex
        };

        // Bring it to view if needed
        helpNeededDOM.scrollIntoView();

        // Bring it above the mask so it is not behind transparent background
        helpNeededDOM.style.position = 'relative';
        helpNeededDOM.style.zIndex = 1234;

        removeElement(this.node);
        this.node = this.getNode();
        this.mask.appendChild(this.node);

        // Append it only it is not already appended
        if (!this.mask.offsetParent) {
          document.body.appendChild(this.mask);
        }

        this.applyStyleToCurrentNode();
      } else {
        onNext();
      }
    } else {
      removeElement(this.mask);

      // Assuming it has finished with all guides or clicked 'Skip'
      this.removeResizeListener();
    }
  }

  render() {
    const { children } = this.props;

    return children || '';
  }
}

class UserGuide extends Component {
  static propTypes = {
    title: PropTypes.string,
    content: PropTypes.string,
    guideKey: PropTypes.string.isRequired,
    guides: PropTypes.array.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.element,
      PropTypes.string,
    ]),
  }

  static defaultProps = {
    guideKey: 'guideKey',
    guides: [],
    title: 'Quick Guide',
    content: 'Would you like us to walk you through different features in this app?'
  }

  constructor(props) {
    super(props);

    this.state = {
      helpIndex: 0,
      acceptedConfirm: false
    };

    this.userGuideDisabledFromBegenning = !!win.localStorage.getItem(`userGuide-${props.guideKey}`);

    this.onSkip = this.onSkip.bind(this);
    this.onNext = this.onNext.bind(this);
    this.acceptConfirm = this.acceptConfirm.bind(this);
  }

  onSkip() {
    const { guides, guideKey } = this.props;

    win.localStorage.setItem(`userGuide-${guideKey}`, true);

    this.setState({
      helpIndex: guides.length
    });
  }

  onNext() {
    const { guides } = this.props;
    const newHelpIndex = this.state.helpIndex + 1;

    if (newHelpIndex > guides.length - 1) {
      this.onSkip();
    } else {
      this.setState({
        helpIndex: newHelpIndex
      });
    }
  }

  acceptConfirm() {
    this.setState({
      acceptedConfirm: true
    });
  }

  render() {
    const {
      children,
      guides,
      title,
      content,
    } = this.props;
    const { helpIndex, acceptedConfirm } = this.state;
    const helpConfig = guides[helpIndex] || {};
    const isLast = helpIndex === (guides.length - 1);

    if (this.userGuideDisabledFromBegenning) {
      return children || '';
    }

    if (helpIndex === 0 && !acceptedConfirm) {
      return (
        <Fragment>
          {children || ''}
          <div className={`userGuide--modal ${styles.userGuideModal}`}>
            <div className={styles.userGuideModalContent}>
              <h1 className={styles.userGuideModalHeader}>{title}</h1>
              <p>{content}</p>
              <div>
                <button onClick={this.onSkip}>
                  No
                </button>
                <button onClick={this.acceptConfirm}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        </Fragment>
      );
    }

    return (
      <HelpText {...helpConfig} onNext={this.onNext} onSkip={this.onSkip} isLast={isLast}>
        {children || ''}
      </HelpText>
    );
  }
}

export default UserGuide;

