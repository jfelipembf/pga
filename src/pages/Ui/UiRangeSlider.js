import React, { useEffect, useState } from "react"
import { Row, Col, Card, CardBody, CardTitle } from "reactstrap"

import { connect } from "react-redux"

//Import Action to copy breadcrumb items from local state to redux state
import { setBreadcrumbItems } from "../../store/actions"

import Slider from "rc-slider"
import "rc-slider/assets/index.css"

const UiRangeSlider = props => {
  document.title =
    "Range Slider | Lexa - Responsive Bootstrap 5 Admin Dashboard"

  const breadcrumbItems = [
    { title: "Lexa", link: "#" },
    { title: "UI Elements", link: "#" },
    { title: "Range Slider", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Range Slider", breadcrumbItems)
  })

  const extra_age = value => value + " Age"

  const [extra, setextra] = useState(52)

  const [value, setValue] = useState(50);

  const handleSliderChange = (newValue) => {
    setValue(newValue);
  };

  const [range, setRange] = useState([30, 90]);

  const handleSliderChange1 = (newRange) => {
    // Limit the range between 30 and 90
    setRange([Math.max(newRange[0], 30), Math.min(newRange[1], 90)]);
  };

  return (
    <React.Fragment>
      <Row>
        <Col className="col-12">
          <Card>
            <CardBody>
              <CardTitle>React Rangeslider</CardTitle>
              <Row>
                <Col md={6}>
                  <div className="p-3">
                    <h5 className="font-size-14 mb-3">Default</h5>
                    <span className="float-left mt-4">0</span>{" "}
                    <span className="float-right  mt-4">100</span>
                    <Slider
                      min={0}
                      max={100}
                      value={value}
                      onChange={handleSliderChange}
                      trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                      handleStyle={{
                        borderColor: "#838de7",
                        height: 20,
                        width: 20,
                        marginTop: -8,
                        backgroundColor: "#838de7",
                      }}
                      railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                    />
                  </div>
                </Col>

                <Col md={6}>
                  <div className="p-3">
                    <h5 className="font-size-14 mb-3">Min-Max</h5>
                    <span className="float-left mt-4">30</span>{" "}
                    <span className="float-right  mt-4">90</span>
                    <Slider
                      // range={range}
                      min={100}
                      max={200}
                      value={range}
                      onChange={handleSliderChange1}
                      trackStyle={[{ backgroundColor: "#838de7", height: 5 }]}
                      handleStyle={[
                        {
                          borderColor: "#838de7",
                          height: 20,
                          width: 20,
                          marginTop: -8,
                          backgroundColor: "#838de7",
                        },
                        {
                          borderColor: "#838de7",
                          height: 20,
                          width: 20,
                          marginTop: -8,
                          backgroundColor: "#838de7",
                        },
                      ]}
                      railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                    />
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="p-3">
                    <h5 className="font-size-14 mb-3">Prefix</h5>
                    <span className="float-left mt-4">0</span>{" "}
                    <span className="float-right  mt-4">100</span>
                    <Slider
                      min={0}
                      max={100}
                      value={[30, 70]}
                      range={[30, 70]}
                      onChange={handleSliderChange}
                      trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                      handleStyle={{
                        borderColor: "#838de7",
                        height: 20,
                        width: 20,
                        marginTop: -8,
                        backgroundColor: "#838de7",
                      }}
                      railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                    />
                  </div>
                </Col>

                <Col md={6}>
                  <div className="p-3">
                    <h5 className="font-size-14 mb-3">Postfixes</h5>
                    <span className="float-left mt-4">0</span>{" "}
                    <span className="float-right  mt-4">100</span>
                    <Slider
                      min={0}
                      max={100}
                      value={[20, 60]}
                      range={[20, 60]}
                      onChange={handleSliderChange}
                      trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                      handleStyle={{
                        borderColor: "#838de7",
                        height: 20,
                        width: 20,
                        marginTop: -8,
                        backgroundColor: "#838de7",
                      }}
                      railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                    />
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="p-3">
                    <h5 className="font-size-14 mb-3">Step</h5>
                    <span className="float-left mt-4">0</span>{" "}
                    <span className="float-right  mt-4">100</span>
                    <Slider
                      min={0}
                      max={100}
                      value={10}
                      onChange={handleSliderChange}
                      trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                      handleStyle={{
                        borderColor: "#838de7",
                        height: 20,
                        width: 20,
                        marginTop: -8,
                        backgroundColor: "#838de7",
                      }}
                      railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                    />
                  </div>
                </Col>

                <Col md={6}>
                  <div className="p-3">
                    <h5 className="font-size-14 mb-3">Custom Values</h5>
                    <Slider
                      min={0}
                      max={100}
                      marks={{
                        10: 10,
                        20: 20,
                        30: 30,
                        40: 40,
                        50: 50,
                        60: 60,
                        70: 70,
                        80: 80,
                        90: 90,
                        100: 100,
                      }}
                      reverse={true}
                      value={[20, 60]}
                      range={[20, 60]}
                      onChange={handleSliderChange}
                      trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                      handleStyle={{
                        borderColor: "#838de7",
                        height: 20,
                        width: 20,
                        marginTop: -8,
                        backgroundColor: "#838de7",
                      }}
                      railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                    />
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="p-3">
                    <h5 className="font-size-14 mb-3">Reverse</h5>
                    <span className="float-left mt-4">100</span>{" "}
                    <span className="float-right  mt-4">0</span>
                    <Slider
                      min={0}
                      max={100}
                      marks={{
                        10: 10,
                        20: 20,
                        30: 30,
                        40: 40,
                        50: 50,
                        60: 60,
                        70: 70,
                        80: 80,
                        90: 90,
                        100: 100,
                      }}
                      reverse={true}
                      value={[20, 60]}
                      range={[20, 60]}
                      onChange={handleSliderChange}
                      trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                      handleStyle={{
                        borderColor: "#838de7",
                        height: 20,
                        width: 20,
                        marginTop: -8,
                        backgroundColor: "#838de7",
                      }}
                      railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                    />
                  </div>
                </Col>

                <Col md={6}>
                  <div className="p-3">
                    <h5 className="font-size-14 mb-3">Extra Example</h5>
                    <span className="float-left mt-4">0</span>{" "}
                    <span className="float-right  mt-4">100</span>
                    <Slider
                      min={0}
                      max={100}
                      format={extra_age}
                      value={extra}
                      onChange={value => {
                        setextra(value)
                      }}
                    />
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="p-3">
                    <h5 className="font-size-14 mb-3">Prettify Numbers</h5>
                    <span className="float-left mt-4">1</span>{" "}
                    <span className="float-right  mt-4">100</span>
                    <Slider
                      min={0}
                      max={100}
                      marks={{
                        10: "10%",
                        20: "20%",
                        30: "30%",
                        40: "40%",
                        50: "50%",
                        60: "60%",
                        70: "70%",
                        80: "80%",
                        90: "90%",
                        100: "100%",
                      }}
                      value={[20, 60]}
                      range={[20, 60]}
                      onChange={handleSliderChange}
                      trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                      handleStyle={{
                        borderColor: "#838de7",
                        height: 20,
                        width: 20,
                        marginTop: -8,
                        backgroundColor: "#838de7",
                      }}
                      railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                    />
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(UiRangeSlider)
