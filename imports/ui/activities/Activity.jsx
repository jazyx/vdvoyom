import { Meteor } from 'meteor/meteor'
import React, { Component } from 'react'

import { withTracker } from 'meteor/react-meteor-data'
import { Session } from 'meteor/session'

import { L10n
       , Activities
       } from '../../api/collections'
import { localize
       , getElementIndex
       , substitute
       } from '../../tools/utilities'
import { setView } from '../../api/methods/methods'

import { StyledProfile
       , StyledPrompt
       , StyledActivity
       , StyledActivities
       , StyledDescription
       , StyledButton
       } from './Styles'


class Activity extends Component {
  constructor(props) {
    super(props)

    this.state = { selected: -1 }
    this.goActivity = this.goActivity.bind(this)
    this.selectActivity = this.selectActivity.bind(this)
    this.scrollIntoView = this.scrollIntoView.bind(this)

    this.scrollTo = React.createRef()

    // Allow Enter to accept the default/current language
    document.addEventListener("keydown", this.goActivity, false)
    window.addEventListener("resize", this.scrollIntoView, false)
  }


  selectActivity(event) {
    const element = event.target
    const selected = getElementIndex(element, "UL")
    if (selected === this.state.selected) {
      return this.goActivity()
    }

    this.setState({ selected })
    this.scrollFlag = true // move fully onscreen if necessary
  }


  goActivity(event) {
    if (event && event.type === "keydown" && event.key !== "Enter") {
      return
    }

    const activity = this.props.activities[this.state.selected]
    if (activity) {
      const view = activity.key
      setView.call({
        view
      , group_id: Session.get("group_id")
      })

      this.props.setView(view)
    }
  }


  scrollIntoView() {
    const element = this.scrollTo.current
    if (element) {
      element.scrollIntoView({behavior: 'smooth'})
    }
  }


  getPhrase(cue, corpus) {
    const map  = corpus[cue]
    let code = Session.get("native")
    let phrase = map[code]

    if (!phrase) {
      code = code.replace(/-.*/, "")
      phrase = map[code]

      if (!phrase) {
        phrase = "***" + cue + "***"
      }
    }

    return phrase
  }


  getPrompt() {
    const code = Session.get("native")
    const prompt = localize("activities", code, this.props.phrases)

    return <StyledPrompt
      aspectRatio={this.props.aspectRatio}
    >
      {prompt}
    </StyledPrompt>
  }


  getActivities() {
    const activities = this.props.activities.map((activity, index) => {
      const lang        = Session.get("native").replace(/-.*/, "")
      const icon        = substitute(activity.icon, { "^0": lang })
      const src         = activity.folder + icon
      const name        = this.getPhrase("name", activity)
      const description = this.getPhrase("description", activity)
      const disabled    = !!activity.disabled
      const selected    = this.state.selected === index
      const ref         = selected
                        ? this.scrollTo
                        : ""
      return <StyledActivity
        key={name}
        src={src}
        ref={ref}
        disabled={disabled}
        selected={selected}
        onMouseUp={this.selectActivity}
        aspectRatio={this.props.aspectRatio}
      >
        <p>{name}</p>
      </StyledActivity>
    })
    return <StyledActivities
      id="activity-list"
      aspectRatio={this.props.aspectRatio}
    >
      {activities}
    </StyledActivities>
  }


  getDescription() {
    let description = ""
    if (this.state.selected < 0) {
      // Nothing is selected
    } else {
      const activity = this.props.activities[this.state.selected]
      description = this.getPhrase("description", activity)
    }

    return <StyledDescription
      aspectRatio={this.props.aspectRatio}
    >
      {description}
    </StyledDescription>
  }


  getButton() {
    const disabled = this.state.selected < 0
    const code = Session.get("native")
    const prompt = localize("start", code, this.props.phrases)

   return <StyledButton
      disabled={disabled}
      onMouseUp={this.goActivity}
      aspectRatio={this.props.aspectRatio}
    >
      {prompt}
    </StyledButton>
  }


  render() {
    const prompt = this.getPrompt()
    const activities = this.getActivities()
    const description = this.getDescription()
    const button = this.getButton()

    return <StyledProfile
      id="activities"
      aspectRatio={this.props.aspectRatio}
    >
      {prompt}
      {activities}
      {description}
      {button}
    </StyledProfile>
  }


  componentDidUpdate() {
    if (this.scrollFlag) {
      setTimeout(this.scrollIntoView, 1000) // <<< HARD-CODED
      this.scrollFlag = false
    }
  }


  componentWillUnmount() {
    window.removeEventListener("resize", this.scrollIntoView, false)
    document.removeEventListener("keydown", this.goActivity, false)
  }
}


export default withTracker(() => {
  // Phrases
  const phraseSelect = {
    $and: [
      { type: { $eq: "phrase" }}
    , { file: { $exists: false }}
    ]
  }
  const phrases = L10n.find(phraseSelect).fetch()

  // Activities
  const activitySelect = {}
  const activities = Activities.find(activitySelect).fetch()

  const props = {
    phrases
  , activities
  }

  return props
})(Activity)