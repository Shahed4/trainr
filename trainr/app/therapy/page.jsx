"use client";

import React, { useState } from "react";
import Link from "next/link";
import Container from "@mui/material/Container";
import { useRouter } from "next/navigation";

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

function Page() {
  const router = useRouter();
  const [selectedExercise, setSelectedExercise] = useState(null);

  const exercises = [
    {
      id: "external_rotation",
      name: "External Shoulder Rotation",
      description: "Focuses on Infraspinatus, teres minor, posterior deltoid. You should feel this stretch in the back of your shoulder and upper back.",
      image: "./assets/images/Standing-Shoulder-Rotation.png",
      route: "/therapy/external"
    },
    {
      id: "pushup",
      name: "Push Up",
      description: "A classic upper body exercise targeting chest, shoulders, and triceps. Maintain proper form with a straight body line.",
      image: "./assets/images/main.png", // You may want to add a push-up image
      route: "/therapy/external" // Can create a separate route later
    }
  ];

  return (
    <div
      style={{
        position: "absolute",
        height: "100%",
        width: "100%",
        backgroundColor: "lightBlue",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <h1
        style={{
          margin: "0",
          padding: "4px 8px",
          textAlign: "left",
          backgroundColor: "white",
          borderRadius: "4px",
          position: "absolute",
          top: "10px",
          left: "10px",
        }}
      >
        Hello TestNAME!
      </h1>

      <h2 style={{ 
        textAlign: "center", 
        backgroundColor: "white", 
        padding: "10px",
        borderRadius: "4px",
        marginBottom: "20px"
      }}>
        Select an Exercise to Start
      </h2>

      <div style={{ 
        display: "flex", 
        flexDirection: "row", 
        gap: "20px",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            style={{
              width: "400px",
              backgroundColor: "white",
              border: "2px solid black",
              padding: "20px",
              textAlign: "center",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            onClick={() => {
              setSelectedExercise(exercise.id);
              router.push(`${exercise.route}?exercise=${exercise.id}`);
            }}
          >
            <h3
              style={{
                margin: "0px 0px 10px 0px",
                padding: "4px 8px",
                backgroundColor: "#2F4F4F",
                color: "white",
                display: "inline-block",
                borderRadius: "5px",
              }}
            >
              {exercise.name}
            </h3>

            <p style={{ margin: "10px 5px" }}>
              {exercise.description}
            </p>
            <img
              src={exercise.image}
              width="200px"
              height="200px"
              style={{ marginTop: "20px", objectFit: "contain" }}
              alt={exercise.name}
            />
            <br />
            <div style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#2F4F4F",
              color: "white",
              borderRadius: "4px",
              fontWeight: "bold"
            }}>
              Click to Start →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Page;
