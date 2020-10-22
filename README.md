# cs4621-final
CS 4621 (Computer Graphics Practicum) Final Project

This is an explorable 3D world written in JavaScript with WebGL. It is procedurally generated based on 2D simplex noise, with a number of features.
- The ground is created from multiple layers of simplex noise, with ground below a certain height being "underwater".
- The water is semi transparent, allowing the viewer to see underwater, with murkiness increasing with depth. But the water is also semi reflective of the sky at shallow viewing angles, with Schlick's approximation being used.
- The world is also dotted with procedurally placed mushrooms objects which act as point light sources. They are parsed by an OBJ parser we built. They give off light of a semi-random color with a luminosity proportional to their size.
- The spawning area also includes "floating islands", which are built using cube marching, from 3D simplex noise.
- As the user moves around, the new regions of the world are spawned, and old regions of the world are removed seamlessly at the edge of visibility. But even if the user leaves an area and returns, it will still be generated exactly the same, with the same terrain and even the same mushroom locations and sizes.

## Controls
- Arrow keys can be used to direction faced. Up and down change the pitch, and left and right change the yaw.
- WASD can be used for movement. W moves forwards, S moves backwards, and A and D translate left and right, respectively.
- The mouse can also be used to change the direction faced. Moving the mouse around will change the forward direction similar to the arrow keys.

## Setup
- Open a command prompt in the root folder.
- Install npm and run `npm install`.
- Open a server using `python3 -m http.server` or `python -m SimpleHTTPServer 8000`, and then going to `localhost:8000` in Chrome.

## Pictures
See the folder "example_images" in the root directory. Some of the images shown use earlier textures and colors, and one shows an early version without some of the features added later.
