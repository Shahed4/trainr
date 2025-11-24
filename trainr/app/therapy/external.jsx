"use client";

import React, { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import { useSearchParams } from "next/navigation";

const boxStyle = {
  backgroundColor: "#2F4F4F",
  color: "white",
  padding: "10px",
  textAlign: "center",
  margin: "10px",
  borderRadius: "5px",
  fontFamily: "Arial, sans-serif",
  fontWeight: "bold",
  width: "150px",
};

const textStyle = {
  backgroundColor: "white",
  color: "black",
  padding: "10px",
  fontWeight: "normal",
};

const exerciseInfo = {
  external_rotation: {
    name: "External Shoulder Rotation",
    image: "/assets/images/Standing_External_Rotation_with_Resistance_Band.gif",
    description: "Focuses on Infraspinatus, teres minor, posterior deltoid"
  },
  pushup: {
    name: "Push Up",
    image: "/assets/images/main.png",
    description: "Classic upper body exercise targeting chest, shoulders, and triceps"
  }
};

export default function ExternalRotation() {
  const searchParams = useSearchParams();
  const exerciseFromUrl = searchParams?.get('exercise') || 'external_rotation';
  const [selectedExercise, setSelectedExercise] = useState(exerciseFromUrl);
  const [videoSrc, setVideoSrc] = useState(`http://localhost:5001/video-feed?exercise=${selectedExercise}`);

  useEffect(() => {
    // Update video source when exercise changes
    const newVideoSrc = `http://localhost:5001/video-feed?exercise=${selectedExercise}&t=${Date.now()}`;
    setVideoSrc(newVideoSrc);
    
    // Force the image to reload by updating its src directly
    const img = document.getElementById("video-stream");
    if (img) {
      // Stop the current stream by setting src to empty
      img.src = "";
      // Small delay to ensure the old connection is closed
      setTimeout(() => {
        img.src = newVideoSrc;
      }, 100);
    }
  }, [selectedExercise]);

  const currentExercise = exerciseInfo[selectedExercise] || exerciseInfo.external_rotation;

  return (
    <div
      style={{
        position: "absolute",
        height: "100%",
        width: "100%",
        backgroundColor: "lightBlue",
      }}
    >
      <h1
        style={{
          margin: "10px auto",
          padding: "4px 8px",
          textAlign: "center",
          backgroundColor: "white",
          display: "inline-block",
          borderRadius: "4px",
        }}
      >
        {currentExercise.name}
      </h1>

      {/* Exercise Selection */}
      <div style={{ 
        textAlign: "center", 
        margin: "10px",
        padding: "10px",
        backgroundColor: "white",
        borderRadius: "4px",
        display: "inline-block"
      }}>
        <label style={{ marginRight: "10px", fontWeight: "bold" }}>
          Select Exercise:
        </label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          style={{
            padding: "8px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "2px solid #2F4F4F",
            cursor: "pointer"
          }}
        >
          <option value="external_rotation">External Shoulder Rotation</option>
          <option value="pushup">Push Up</option>
        </select>
      </div>

      <Container
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ padding: "10px", border: "2px solid black" }}>
          <h2 style={{ marginTop: "0px" }}>Follow this Exercise!</h2>
          <img
            src={currentExercise.image}
            alt={currentExercise.name}
            style={{
              width: "400px",
              height: "200px",
              marginLeft: "auto",
              marginRight: "auto",
              objectFit: "contain",
            }}
          />
        </div>
        <div style={{ padding: "10px", border: "2px solid black" }}>
          <h2 style={{ marginLeft: "20px" }}>YOU!</h2>
          <img
            id="video-stream"
            key={`video-${selectedExercise}`}
            src={videoSrc}
            alt="Video Stream"
            style={{
              width: "400px",
              height: "200px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          />
        </div>
      </Container>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={boxStyle}>
          <div>Repetitions</div>
          <div style={textStyle}>3 sets of 8</div>
        </div>
        <div style={boxStyle}>
          <div>Days per week</div>
          <div style={textStyle}>3</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "30px",
        }}
      >
        <div
          style={{
            border: "2px solid black",
            borderRadius: "4px",
            width: "500px",
            padding: "10px",
            textAlign: "left",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                margin: "0px",
                padding: "4px 8px",
                backgroundColor: "white",
                display: "inline-block",
                borderRadius: "5px",
              }}
            >
              {" "}
              Procedure
            </h3>
          </div>
          <ol>
            <li style={{ fontSize: "20px" }}>
              Make a 3-foot-long loop with the elastic band and tie the ends
              together. Attach the loop to a doorknob or other stable object.
            </li>
            <li style={{ fontSize: "20px" }}>
              Stand holding the band with your elbow bent and at your side, as
              shown in the start position.
            </li>
            <li style={{ fontSize: "20px" }}>
              Keeping your elbow close to your side, slowly rotate your arm
              outward.
            </li>
            <li style={{ fontSize: "20px" }}>
              Slowly return to the start position and repeat.
            </li>
          </ol>
        </div>
      </div>

      <div style={{ position: "absolute", backgroundColor: "black" }}></div>
    </div>
  );
}
