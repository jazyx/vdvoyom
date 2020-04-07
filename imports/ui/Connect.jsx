import React, { Component } from 'react';
import Splash  from './connect/Splash.jsx';
import Native  from './connect/Native.jsx';
import collections from '../api/collections'




export default class Connect extends Component {
  constructor(props) {
    super(props)

    /// <<< HARD-CODED minimum time (ms) to show the Splash screen
    const splashDelay = 1000
    /// HARD-CODED >>>
    
    this.state = {
      view: "Splash"
    , showSplash: + new Date() + splashDelay
    }

    this.views = {
      Splash
    , Native
    }
    this.setView = this.setView.bind(this)
    this._checkForCollections = this._checkForCollections.bind(this)

    // When the application is first loaded, the server will not yet
    // have had time to populate the miniMongo collections, so they
    // will exist but they will be empty. Show a splash screen until
    // the collections are ready.

    // For each collection that is required at startup, add an object
    // with a `query` which will return a minimum number of documents,
    // plus a `count` property whose value is this required minimum.
    // If it's enough to have a single document in the collection,
    // you can use 0 as the value for the collection name
    // property.

    this.requiredQueries = {
      "L10n": [
        { query: { folder: { $exists: true } }
        , count: 1
        }
      , { query: { file: { $exists: true} }
        , count: 4
        }
      ]
    }
    this._checkForCollections()
  }


  _checkForCollections() {
    const collectionNames = Object.keys(this.requiredQueries)
    const basic = [ { query: {}, count: 1 } ]

    const ready = collectionNames.every(collectionName => {
      const collection = collections[collectionName]
      const checks     = this.requiredQueries[collectionName] || basic
      const checked    = checks.every(check => {
        const query    = check.query || {}
        const count    = check.count || 1
        const passed   = collection.find(query).count() >= count

        return passed
      })

      return checked
    })

    if (ready && (+ new Date() > this.state.showSplash)) {
      this.setState({ showSplash: 0, view: "Native" })
    } else {
      setTimeout(this._checkForCollections, 100)
    }
  }


  setView(view) {
    if (!view) {
      this.setState({
        view: "Splash"
      , showSplash: + new Date()
      })
      this._checkForCollections()

    } else if (view === "Game") {
      this.props.setView(view)


    } else if (this.views.indexOf(view) < 0 ) {
      console.log("Unexpected view in Connect:", view)

    } else {
      this.setState({
        view
      })
    }
  }


  render() {
    const View = this.views[this.state.view]

    return <View setView={this.setView} />
  }
}