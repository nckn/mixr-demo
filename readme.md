# MiXR Demo

## Setup
Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```

TODO
- add shader from ex. 35
- tv shader w/ post-processing lines (type)
- add godrays: https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_godrays.html

Video clip from Old TV time
https://www.youtube.com/channel/UCUj8lkSnX-BnTXBYj8kwvsQ



- - -  
Info
#### Where is the gooey blob anim time set?
### LongPress.js/ in tick() method




TODO
- add props eg. neon sign




Questions

789 - // ?? Where do we animate noise?
790 - // this.animateNoise()

957 - // ?? WHere do we detect an object with raycaster?
957 - // self.intersectedObject = self.intS


```
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';

// Passes
filmPass: null,

self.filmPass = new FilmPass(
  0.35,   // noise intensity
  0.025,  // scanline intensity
  648,    // scanline count
  false,  // grayscale
);
self.filmPass.renderToScreen = true;
self.composer.addPass(self.filmPass);




else if (ob.name === 'Scan lines') {
  console.log('scan lines: ', self.filmPass.uniforms.sIntensity)
  self.filmPass.uniforms.sIntensity.value = ob.value
  // self.refreshText()
}
else if (ob.name === 'Noise intensity') {
  console.log('scan lines: ', self.filmPass.uniforms.sIntensity)
  self.filmPass.uniforms.nIntensity.value = ob.value 
}
```