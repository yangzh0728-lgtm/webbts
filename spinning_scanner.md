---
layout: default
title: Simple Spinning 2D Scanner — Innovator Journal
journal: true
scanner: true
---

## My progress

I finished assembling and wiring my simple spinning 2D scanner prototype by connecting the Arduino-compatible board, breadboard, ultrasonic distance sensor, stepper motor, and motor-driver board. The goal is for the motor to rotate the sensor so it can measure distances in different directions. Right now, my project is only at the “skateboard” level, following the idea of building something simple before working toward a more advanced “sports car” version of a 3D scanner. Starting small will allow me to test the basic functions, learn from problems, and improve the design step by step. These photos show the completed assembly and wiring, but I have not tested it yet. My next step is to check the connections and test whether the motor rotates and the sensor measures distances correctly.

## Work in progress

<div class="project-photos">
  <figure>
    <a href="{{ '/assets/images/spinning-scanner-assembly.jpg' | relative_url }}">
      <img src="{{ '/assets/images/spinning-scanner-assembly.jpg' | relative_url }}" alt="Assembled scanner prototype held in two hands, showing the breadboard, Arduino-compatible board, ultrasonic sensor, and motor-driver wiring." width="1280" height="1707" loading="lazy" decoding="async">
    </a>
    <figcaption><strong>Assembly and wiring complete.</strong> An overview of my connected components before testing.</figcaption>
  </figure>
  <figure>
    <a href="{{ '/assets/images/spinning-scanner-closeup.jpg' | relative_url }}">
      <img src="{{ '/assets/images/spinning-scanner-closeup.jpg' | relative_url }}" alt="Close view of the ultrasonic sensor above the stepper motor, with jumper wires connected to the controller and motor-driver board." width="1280" height="1707" loading="lazy" decoding="async">
    </a>
    <figcaption><strong>A closer look at the build.</strong> The sensor, motor, and connections that I still need to test.</figcaption>
  </figure>
</div>

## Next steps

First, I will check the wiring against the intended connections. Then I will test the motor’s movement and the ultrasonic sensor’s distance readings. Once these functions work, I can work toward combining rotation and measurements into a simple 2D scan. I will document any problems and changes in my next journal entry.
