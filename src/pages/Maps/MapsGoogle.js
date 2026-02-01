import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api"
import { Row, Col, Card, CardBody, CardTitle, CardSubtitle } from "reactstrap"
import { setBreadcrumbItems } from "store/actions"
import { connect } from "react-redux"


const containerStyle = {
  width: "100%",
  height: "300px",
}

const center = {
  lat: 37.778519,
  lng: -122.40564,
}

const second = {
  lat: 54.526,
  lng: 15.2551,
}

const third = {
  lat: 8.7832,
  lng: 34.5085,
}

const forth = {
  lat: 19.076,
  lng: 72.8777,
}

const MapsGoogle = props => {
  document.title = "Maps Google | Lexa - Responsive Bootstrap 5 Admin Dashboard"

  const breadcrumbItems = [
    { title: "Lexa", link: "#" },
    { title: "Maps", link: "#" },
    { title: "Google Maps", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Google Maps", breadcrumbItems)
  })

  const selectedPlace = {}

  const [selected, setSelected] = useState(null)

  const onSelect = marker => {
    setSelected(marker)
  }

  return (
    <React.Fragment>
      <Row>
        <Col lg={6}>
          <Card>
            <CardBody>
              <CardTitle>Markers</CardTitle>
              <CardSubtitle className="mb-3">
                Example of google maps.
              </CardSubtitle>
              <div
                id="gmaps-markers"
                className="gmaps"
                style={{ position: "relative" }}
              >
                <LoadScript googleMapsApiKey="AIzaSyAbvyBxmMbFhrzP9Z8moyYr6dCr-pzjhBE">
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={14}
                  >
                    <Marker
                      position={center}
                      onClick={() => onSelect(center)}
                    />
                    {selected && (
                      <InfoWindow
                        position={selected}
                        onCloseClick={() => setSelected(null)}
                      >
                        <div>
                          <h1>{selectedPlace.name}</h1>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <CardBody>
              <CardTitle>Overlays</CardTitle>
              <CardSubtitle className="mb-3">
                Example of google maps.
              </CardSubtitle>
              <div
                id="gmaps-overlay"
                className="gmaps"
                style={{ position: "relative" }}
              >
                <LoadScript googleMapsApiKey="AIzaSyAbvyBxmMbFhrzP9Z8moyYr6dCr-pzjhBE">
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={second}
                    zoom={14}
                  >
                    <Marker
                      position={second}
                      onClick={() => onSelect(second)}
                    />
                    {selected && (
                      <InfoWindow
                        position={selected}
                        onCloseClick={() => setSelected(null)}
                      >
                        <div>
                          <h1>{selectedPlace.name}</h1>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card>
            <CardBody>
              <CardTitle>Street View Panoramas</CardTitle>
              <CardSubtitle className="mb-3">
                Example of google maps.
              </CardSubtitle>
              <div
                id="gmaps-markers"
                className="gmaps"
                style={{ position: "relative" }}
              >
                <LoadScript googleMapsApiKey="AIzaSyAbvyBxmMbFhrzP9Z8moyYr6dCr-pzjhBE">
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={third}
                    zoom={14}
                  >
                    <Marker position={third} onClick={() => onSelect(third)} />
                    {selected && (
                      <InfoWindow
                        position={selected}
                        onCloseClick={() => setSelected(null)}
                      >
                        <div>
                          <h1>{selectedPlace.name}</h1>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <CardBody>
              <CardTitle>Map Types</CardTitle>
              <CardSubtitle className="mb-3">
                Example of google maps.
              </CardSubtitle>
              <div
                id="gmaps-overlay"
                className="gmaps"
                style={{ position: "relative" }}
              >
                <LoadScript googleMapsApiKey="AIzaSyAbvyBxmMbFhrzP9Z8moyYr6dCr-pzjhBE">
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={forth}
                    zoom={14}
                  >
                    <Marker position={forth} onClick={() => onSelect(forth)} />
                    {selected && (
                      <InfoWindow
                        position={selected}
                        onCloseClick={() => setSelected(null)}
                      >
                        <div>
                          <h1>{selectedPlace.name}</h1>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  )
}

MapsGoogle.propTypes = {
  google: PropTypes.object,
}

// export default MapsGoogle
export default connect(null, { setBreadcrumbItems })(MapsGoogle);