import './assets/scss/main.scss'
import * as dat from 'dat.gui'
import * as THREE from 'three'
import { TweenMax, TimelineMax, Sine, Power3, Power4, Expo } from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
// import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js'

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'

import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';

// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
// import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
// Misc helper functions
import {
  checkIfTouch,
  map,
  createPoints,
  noise
} from '../static/js/helpers.js'
// Longpress
import LongPress from '../static/js/LongPress.js'
// volumetric / godrays shaders
import godRaysShaders from '../static/js/godrays-shaders.js'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'
import { DoubleSide } from 'three'


// import SimplexNoise from 'simplex-noise'

import AnimatedChar from '../static/js/Character.js'

// require('../static/js/splitTextPlugin.js')
import * as SplitText from '../static/js/splitTextPlugin.js'

// Noise related - start
import { spline } from '@georgedoescode/spline'
// our <path> element
const path = document.querySelector("#circlePath")
// used to set our custom property values
const root = document.documentElement
let hueNoiseOffset = 0
let noiseStep = 0.005
const points = createPoints()
// Noise related - end


// import videoTexture from '../static/js/video-texture.js'
///////////
// VIDEO //
///////////

// alternative method -- 
// create DIV in HTML:
// <video id="myVideo" autoplay style="display:none">
//		<source src="videos/sintel.ogv" type='video/ogg; codecs="theora, vorbis"'>
// </video>
// and set JS variable:
// video = document.getElementById( 'myVideo' );

let video = null
let videoImage = null
let videoImageContext = null
let videoTexture = null
let movieMaterial = null
let neonLightOne = null

// Animation
const stdTime = 1.25

// the geometry on which the movie will be displayed;
// 		movie image will be scaled to fit these dimensions.

// /**
//  * Spector JS
//  */
// const SPECTOR = require('spectorjs')
// const spector = new SPECTOR.Spector()
// spector.displayUI()

// Audio example
// https://github.com/mrdoob/three.js/blob/master/examples/webaudio_sandbox.html

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

let camera = null
let renderer = null
let controls = null
let effectComposer = null
let renderTarget = null
let clock = null

let posSpotLightTL = null

// Debug
let gui = new dat.GUI({
  width: 400
})

dat.GUI.toggleHide()

// Canvas
const canvas = document.querySelector('canvas.webgl')
// Preloader and play buttons
const preloaderOverlay = document.querySelector('.loader-overlay')
const playButton = document.querySelector('.sound-button')
// preloaderOverlay.style.display = 'none'
// preloaderOverlay.style.opacity = 0

// Scene
const scene = new THREE.Scene()
// const color = 0x000000;
// const near = 10;
// const far = 100;
// scene.fog = new THREE.Fog(color, near, far);
// scene.fog = new THREE.FogExp2( 0x000000, 0.1 );

const sounds = [
  { name: 'NeonLight1', path: 'neonlight-highpitch-119845.mp3', volume: 0.5 },
  { name: 'boxLightSmall', path: 'hum-also-known-as-sun.mp3', volume: 0.05 }
]
let canPassSound = false

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
// const bakedTexture = textureLoader.load('baked.jpg') // org. from Bruno Simon
// const bakedTexture = textureLoader.load('bakedMine.jpg') // Mine from landscape-playground.blend
// const bakedTexture = textureLoader.load('baked-industrial-space.jpg') // Mine from landscape-playground.blend
// const bakedFloorTexture = textureLoader.load('billund-transport-Q1.jpg') // Mine from landscape-playground.blend

const bakedFloorTexture = textureLoader.load('bakedFloor_captcha.jpg') // Mine from landscape-playground.blend
const bakedFloorTextureAlphaMap = textureLoader.load('bakedFloor_alphaMap.png') // Mine from landscape-playground.blend

bakedFloorTexture.flipY = false
bakedFloorTexture.encoding = THREE.sRGBEncoding

/**
 * Materials
 */
// Baked material
// const bakedFloorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const bakedFloorMaterial = new THREE.MeshStandardMaterial({
  map: bakedFloorTexture,
  alphaMap: bakedFloorTextureAlphaMap,
  // aoMapIntensity: 1,
  transparent: true
})

const materialGreyStandard = new THREE.MeshStandardMaterial({ color: 0x202020 })

// Portal light material
let portalLightMaterial = null
const boxLightSmallMaterial = new THREE.MeshBasicMaterial({ color: 0xffc0cb })
// const boxLightLargeMaterial = new THREE.MeshBasicMaterial({ 
//   color: 0xffffff
// })
let boxLightLargeMaterial = new THREE.MeshStandardMaterial({
  color: 0x333333,
  roughness: 0,
  metalness: 0,
  emissive: 0xffffff,
  flatShading: true
})

// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 })

export default class Setup {
  constructor() {
    // Godrays shaders
    this.godRaysMaterial = ''
    this.coneMesh = ''
    this.spotLight = ''
    this.coneRadius = {
      value: 7
    }
    this.godrayVShader = godRaysShaders.godrayVShader
    this.godrayFShader = godRaysShaders.godrayFShader
    this.allSpots = []
    this.coneHeight = 22

    this.debugObject = {}

    this.INTERSECTED = ''
    this.intS = null
    this.intersectedObject = null
    this.showAnnotation = true
    this.meshes = []
    this.popover = document.querySelector('.popover')

    this.theCap = null

    // Character related
    this.animatedCharacters = []

    // To store all sounds
    this.allSounds = []

    this.mixer = null

    this.filmPass = null

    this.masterInit()

    // this.simplex = new SimplexNoise()

    // Add DOM events
    this.addDOMEvents()
  }

  masterInit() {
    this.makeShaderMaterial() // First lets make the shader material since dat gui needs it
    this.setupTweakGui() // Secondly lets setup tweak gui
    this.init()
    // this.setupMovie()
    this.setupNecessaryAudio()

    this.loadModel()

    this.loadModelFBX()

    this.addLights()
    
    this.addGrid()

    this.setupControls()

    // this.addFog()

    // this.addGodRays()
    this.initPostprocessing()
    // Tooltip animation
    this.initTooltipAnim()
    // Setup long press logic
    this.setupLongPressLogic()
    // this.tick()
  }

  setupControls() {
    var self = this
    this.sliderSpeed = document.querySelector('#sliderSpeed')
    this.sliderSpeed.addEventListener('input', e => {
      console.log('changing')
      let target = e.target
      
      console.log('target')
      console.log(typeof target.value)

      self.mixer.timeScale = parseFloat( target.value )
    })
    
    // Filmpass sIntensity
    this.sliderScanlines = document.querySelector('#sliderScanlines')
    this.sliderScanlines.addEventListener('input', e => {
      console.log('changing')
      let target = e.target
      
      // console.log('target')
      // console.log(typeof target.value)
      self.filmPass.uniforms.sIntensity.value = parseFloat( target.value )
    })
    
    // Filmpass nIntensity
    this.sliderScanlinesTwo = document.querySelector('#sliderScanlinesTwo')
    this.sliderScanlinesTwo.addEventListener('input', e => {
      console.log('changing')
      let target = e.target
      
      // console.log('target')
      // console.log(typeof target.value)
      self.filmPass.uniforms.nIntensity.value = parseFloat( target.value )
    })
  }

  addGrid() {
    const grid = new THREE.GridHelper( 2000, 20, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );
  }

  addLights() {

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 50, 0);
    light.castShadow = true
    scene.add(light);


    var lightAmbient = new THREE.AmbientLight(0xf0f0f0)
    scene.add(lightAmbient)
  }

  addFog() {
    // var self = this
    // Add fog
    let fogColor = new THREE.Color(0x000000);

    scene.background = fogColor;
    scene.fog = new THREE.Fog(fogColor, 0, 40);
  }

  init() {
    var self = this

    /**
     * Camera
     */
    // Base camera
    camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000)

    // camera.position.x = -10
    // camera.position.y = 2
    // camera.position.z = -10

    // Camera values ideally as set in Blender project "konradstudio-space-1a", but not yet
    // camera.position.set(-5.5, 3.4, 7.6)
    camera.position.set(-3.3, 3.05, 4.41)

    // camera.position.set(9.55, 7.98, 11.06)

    scene.add(camera)

    this.addOrbitControls()

    /**
     * Renderer
     */
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputEncoding = THREE.sRGBEncoding

    // Make clock
    clock = new THREE.Clock()

    // self.characterStudioNewton = new AnimatedChar({
    //   scene,
    //   camera,
    //   // loader: this.gltfLoader,
    //   loader: gltfLoader,
    //   // modelPath: 'models/character_male_nielskonrad_rigged_with_anim_typing.glb',
    //   modelPath: 'models/mixr-demo-1a.glb',
    //   modelTexturePath: '',
    //   charName: 'nielskonrad',
    //   customMaterial: this.portalLightMaterial
    // })

    this.animatedCharacters.push(self.characterStudioNewton)

    window.addEventListener('resize', this.onResize)
  }

  setupLongPressLogic() {
    var self = this
    let longPrss = new LongPress();
    // TODO: Look into webgl-mouse-hover or something, to see
    // how to handle callbacks and return functions
  }

  setupNecessaryAudio() {
    var self = this
    // Create a listener
    this.listener = new THREE.AudioListener()
    camera.add(this.listener)
    // Create sound loader
    this.audioLoader = new THREE.AudioLoader()
  }

  loadSound(soundIndex, parent) {
    var self = this
    var sound = new THREE.PositionalAudio(self.listener);
    console.log('sound index: ', 'sound/' + sounds[soundIndex])
    // return
    this.audioLoader.load('sound/' + sounds[soundIndex].path, function (buffer) {
      sound.setBuffer(buffer)
      sound.setRefDistance(20)
      sound.setLoop(true)
      sound.setVolume(sounds[soundIndex].volume)
      sound.play()
      parent.add(sound)
      // sounds.audio = sound
      // console.log('its working alright')
    })
    //
    // store sound and add to global array
    const analyser = new THREE.AudioAnalyser(sound, 32);
    this.allSounds.push({ snd: sound, analyser: analyser, parent: parent })
    // console.log()
  }

  loadModelFBX() {
    var self = this
    // model
    const loader = new FBXLoader();
    
    // const fileName = 'walking-hopelessly_1b_after_MIXAMO_98U.fbx'
    const fileName = 'troll-throwing-tree_DEFAULT_98U.fbx'

    // loader.load('models/fbx/Samba Dancing.fbx', function (object) {
    loader.load(fileName, function (object) {

      self.mixer = new THREE.AnimationMixer(object);
      // self.mixer.timeScale = 2

      const action = self.mixer.clipAction(object.animations[0]);
      action.play();

      object.traverse(function (child) {

        if (child.isMesh) {

          // child.material = materialGreyStandard

          child.castShadow = true;
          child.receiveShadow = true;

        }

      });

      const sF = 0.01

      object.scale.set( sF, sF, sF )

      scene.add(object);

      self.loadSound( 1, object )

    })

    // const loader = new BVHLoader();
    // const fileName = 'walking-hopelessly_1b_after_MIXAMO_98U.bvh'
    // loader.load( fileName, function ( result ) {

    //   // skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
    //   // skeletonHelper.skeleton = result.skeleton; // allow animation mixer to bind to THREE.SkeletonHelper directly

    //   const boneContainer = new THREE.Group();
    //   boneContainer.add( result.skeleton.bones[ 0 ] );

    //   scene.add( skeletonHelper );
    //   scene.add( boneContainer );

    //   // play animation
    //   self.mixer = new THREE.AnimationMixer( skeletonHelper );
    //   self.mixer.clipAction( result.clip ).setEffectiveWeight( 1.0 ).play();

    // } )
}

  loadModel() {
    var self = this
    /**
     * Model
     */
    gltfLoader.load(
      // 'portal.glb', // org. from Bruno Simon
      // 'landscape-playground.glb', // Mine from landscape-playground.blend
      // 'industrial-space-1.glb', // Mine from landscape-playground.blend
      // 'models/industrial-space-1c.glb', // Mine from landscape-playground.blend

      // 'models/konradstudio-space-1a.glb', // Mine from landscape-playground.blend
      'models/captcha-1a.glb', // Mine from landscape-playground.blend
      (gltf) => {
        // Bruno Simons 'portal.blend' model
        gltf.scene.traverse(child => {
          
          // console.log(child)
          console.log(child.name)

          // child.material = bakedFloorMaterial
          // Add each child to the meshes array
          this.meshes.push(child)
          // Assign ID to mesh
          child.userData.id = 0

          // Floor
          if (
            child.name === 'Floor'
          ) {
            child.material = bakedFloorMaterial
            child.receiveShadow = true
          }
          
          // Floor
          if (
            child.name === 'pac_man_machine' ||
            child.name === 'cap'
          ) {
            child.visible = false
          }
       
        })

        scene.add(gltf.scene)

        // this.setupMovie()
        this.tickTock()
      }
    )
  }

  setupMovie() {
    // create the video element
    video = document.createElement('video');
    // video.id = 'video';
    // video.type = ' video/ogg; codecs="theora, vorbis" ';
    video.src = "video/teenage-conflict-1960-xs-comp.mp4";
    video.load(); // must call after setting/changing source
    video.loop = true

    videoImage = document.createElement('canvas');
    videoImage.width = 675;
    videoImage.height = 540;

    videoImageContext = videoImage.getContext('2d');
    // background color if no video present
    videoImageContext.fillStyle = '#000000';
    videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);

    videoTexture = new THREE.Texture(videoImage);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    movieMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, overdraw: true, side: THREE.DoubleSide });
    const videoSize = { w: 4, h: 4 }
    var movieGeometry = new THREE.PlaneGeometry(videoSize.w, videoSize.h, 4, 4);
    var movieScreen = new THREE.Mesh(movieGeometry, movieMaterial);
    movieScreen.position.copy(this.lightBoxLarge.position)
    movieScreen.position.y += movieScreen.scale.y / 2
    movieScreen.position.x -= 0.4
    movieScreen.position.z -= 0.2
    // movieScreen.rotation.copy(this.lightBoxLarge.rotation * new THREE.Vector3(Math.PI / 2, Math.PI / 2, Math.PI / 2))
    movieScreen.rotation.y = 1.1
    // movieScreen.rotation.set(new THREE.Vector3( 0, Math.PI / 2, 0));
    movieScreen.scale.copy(this.lightBoxLarge.scale)
    movieScreen.scale.x /= 4
    movieScreen.scale.y /= 4
    scene.add(movieScreen);
    console.log('setting up movie alright')
  }

  setupTweakGui() {
    var self = this
    /**
     * Base
     */
    const parameters = {
      color: 0xff0000
    }
    // Pole light material
    const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 })

    // Portal light material
    this.debugObject.portalColorStart = '#ff0000'
    this.debugObject.portalColorEnd = '#0000ff'

    gui
      .addColor(this.debugObject, 'portalColorStart')
      .onChange(() => {
        portalLightMaterial.uniforms.uColorStart.value.set(this.debugObject.portalColorStart)
      })

    gui
      .addColor(this.debugObject, 'portalColorEnd')
      .onChange(() => {
        portalLightMaterial.uniforms.uColorEnd.value.set(this.debugObject.portalColorEnd)
      })

    portalLightMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(this.debugObject.portalColorStart) },
        uColorEnd: { value: new THREE.Color(this.debugObject.portalColorEnd) }
      },
      vertexShader: portalVertexShader,
      fragmentShader: portalFragmentShader
    })

    gui.add(self.coneRadius, 'value').min(1).max(10).step(0.1).name('Cone Radius')
    // gui.add( self.coneHeight, 'value').min(1).max(30).step(0.1).name('Cone height')
    gui.add(self.godRaysMaterial.uniforms['anglePower'], 'value').min(0.1).max(20).step(0.1).name('Angle Power')
    gui.add(self.godRaysMaterial.uniforms['attenuation'], 'value').min(0).max(30).step(0.1).name('Attenuation')
    gui.addColor(parameters, 'color')
      .onChange(() => {
        // material.color.set(parameters.color)
        self.allSpots[0].coneMesh.material.uniforms.lightColor.value = new THREE.Color(parameters.color)
      })
  }

  initPostprocessing() {
    var self = this
    // Post processing
    let RenderTargetClass = null

    if (renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2) {
      RenderTargetClass = THREE.WebGLMultisampleRenderTarget
      console.log('Using WebGLMultisampleRenderTarget')
    }
    else {
      RenderTargetClass = THREE.WebGLRenderTarget
      console.log('Using WebGLRenderTarget')
    }

    renderTarget = new RenderTargetClass(
      800,
      600, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        encoding: THREE.sRGBEncoding
      }
    )

    // FXAA to avoid pixelated
    let fxaaPass = new ShaderPass( FXAAShader );

    // Effect composer
    effectComposer = new EffectComposer(renderer, renderTarget)
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    effectComposer.setSize(sizes.width, sizes.height)

    // Render pass
    const renderPass = new RenderPass(scene, camera)
    effectComposer.addPass(renderPass)

    self.filmPass = new FilmPass(
      0.35,   // noise intensity
      0.025,  // scanline intensity
      648,    // scanline count
      false,  // grayscale
    )
    self.filmPass.renderToScreen = true
    effectComposer.addPass(self.filmPass)
    
    // FXAA shader
    effectComposer.addPass( fxaaPass )

    const effectGrayScale = new ShaderPass( LuminosityShader );
    effectComposer.addPass( effectGrayScale );

    // you might want to use a gaussian blur filter before
    // the next pass to improve the result of the Sobel operator

    // Sobel operator

    let effectSobel = new ShaderPass( SobelOperatorShader );
    effectSobel.uniforms[ 'resolution' ].value.x = window.innerWidth * window.devicePixelRatio;
    effectSobel.uniforms[ 'resolution' ].value.y = window.innerHeight * window.devicePixelRatio;
    effectComposer.addPass( effectSobel );


    // Antialias pass
    if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) {
      const smaaPass = new SMAAPass()
      effectComposer.addPass(smaaPass)

      console.log('Using SMAA')
    }

    // Unreal Bloom pass
    const unrealBloomPass = new UnrealBloomPass()
    // unrealBloomPass.enabled = false
    effectComposer.addPass(unrealBloomPass)

    // unrealBloomPass.strength = 0.622
    unrealBloomPass.strength = 0.8
    // unrealBloomPass.radius = 1
    unrealBloomPass.radius = 0.1
    unrealBloomPass.threshold = 0.6

    gui.add(unrealBloomPass, 'enabled')
    gui.add(unrealBloomPass, 'strength').min(0).max(2).step(0.001)
    gui.add(unrealBloomPass, 'radius').min(0).max(2).step(0.001)
    gui.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.001)
  }

  makeShaderMaterial() {
    var self = this
    var volParams = {
      anglePower: 2.7,
      attenuation: 13,
    }
    self.godRaysMaterial = new THREE.ShaderMaterial({
      uniforms: {
        attenuation: {
          type: 'f',
          value: volParams.attenuation
        },
        anglePower: {
          type: 'f',
          value: volParams.anglePower
        },
        spotPosition: {
          type: 'v3',
          value: new THREE.Vector3(0, 0, 0)
        },
        lightColor: {
          type: 'c',
          value: new THREE.Color('cyan')
        },
      },
      vertexShader: self.godrayVShader,
      fragmentShader: self.godrayFShader,
      // side		: THREE.DoubleSide,
      // blending	: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  }

  addGodRays(colonePos) {
    var self = this
    // add spot light
    console.log('should add god ray')
    // self.coneRadius = 7
    var lightAngle = self.coneRadius.value / 12
    var cone = new THREE.CylinderBufferGeometry(0.1, self.coneRadius.value, self.coneHeight, 32 * 2, 20, true)
    // var cone = new THREE.BoxBufferGeometry( 100, 100, 100 )

    // cone.applyMatrix4( new THREE.Matrix4().makeTranslation( 0, -cone.parameters.height/2, 0 ) )
    // cone.applyMatrix4( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) )

    const coneMesh = new THREE.Mesh(cone, self.godRaysMaterial)
    // self.coneMesh.position.set( colonePos )
    coneMesh.position.set(colonePos.x, colonePos.y, colonePos.z)
    // coneMesh.position.set( 0, 5, 0 )

    coneMesh.lookAt(colonePos)
    self.godRaysMaterial.uniforms.lightColor.value.set('blue')
    self.godRaysMaterial.uniforms.spotPosition.value = coneMesh.position
    coneMesh.renderOrder = 10
    scene.add(coneMesh)

    const spotLight = new THREE.SpotLight()
    spotLight.color = coneMesh.material.uniforms.lightColor.value
    spotLight.exponent = 30
    spotLight.angle = lightAngle
    spotLight.intensity = 0.2

    // Soften the edge of the light contact
    spotLight.penumbra = 0.52

    spotLight.position.copy(coneMesh.position)
    coneMesh.add(spotLight)

    self.allSpots.push({ coneMesh: coneMesh, spotLight: spotLight })
  }

  animateNoise() {
    path.setAttribute("d", spline(points, 1, true));

    // for every point...
    for (let i = 0; i < points.length; i++) {
      const point = points[i]

      // return a pseudo random value between -1 / 1 based on this point's current x, y positions in "time"
      const nX = noise(point.noiseOffsetX, point.noiseOffsetX)
      const nY = noise(point.noiseOffsetY, point.noiseOffsetY)
      // map this noise value to a new value, somewhere between it's original location -20 and it's original location + 20
      const x = map(nX, -1, 1, point.originX - 20, point.originX + 20)
      const y = map(nY, -1, 1, point.originY - 20, point.originY + 20)

      // update the point's current coordinates
      point.x = x
      point.y = y

      // progress the point's x, y values through "time"
      point.noiseOffsetX += noiseStep
      point.noiseOffsetY += noiseStep
    }

    const hueNoise = noise(hueNoiseOffset, hueNoiseOffset)
    const hue = map(hueNoise, -1, 1, 0, 360)

    root.style.setProperty("--startColor", `hsl(${hue}, 100%, 75%)`)
    root.style.setProperty("--stopColor", `hsl(${hue + 60}, 100%, 75%)`)
    document.body.style.background = `hsl(${hue + 60}, 75%, 5%)`

    hueNoiseOffset += noiseStep / 6
  }

  tickTock() {
    var self = this
    // const elapsedTime = clock.getElapsedTime()

    // let noise = self.simplex.noise3D(x / 160, x / 160, self.tT/mouseY) * fx1 + fx2;
    // TODO Implenting noise and need to use it for something
    // let noise = self.simplex.noise2D(elapsedTime, 1)
    // console.log('noise')
    // console.log(noise)

    // Update materials
    // portalLightMaterial.uniforms.uTime.value = elapsedTime

    // Set intensity based on sound volume - start
    self.allSounds.forEach((sound, index) => {
      // console.log(sound.parent)
      if (sound.parent.name === 'NeonLight1') {
        var freq = sound.analyser.getFrequencyData()[0]
        var scaledVal = map(freq, 0, 256, 0.0, 1.0)
        // console.log(scaledVal)
        // Set boxLightMaterial emissive intensity
        neonLightOne.material.emissiveIntensity = scaledVal;
      }
    });

    // Update controls
    controls.update()

    // ?? Where do we animate noise?
    // this.animateNoise()

    // Render
    // renderer.render(scene, camera)
    effectComposer.render()

    if (self.intersectedObject) {
      self.updateScreenPosition();
    }

    // Call tick again on the next frame
    window.requestAnimationFrame(() => {
      this.tickTock()
    })

    const delta = clock.getDelta()

		if ( self.mixer ) {
      self.mixer.update( delta )
      // console.log('oughta update')
    }

    // Update the characters and their animation
    // if (this.animatedCharacters.length > 0) {
    //   this.animatedCharacters.map(anim => {
    //     anim.update()
    //   })
    // }
  }

  onResize() {
    var self = this
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  // Add DOM events
  addDOMEvents() {
    var self = this
    playButton.addEventListener('click', () => {
      console.log('play')
      // self.listener.context.resume()
      preloaderOverlay.classList.add('loaded')

      // video.play();
      // self.masterInit()
    })
    window.addEventListener('keydown', function (event) {
      console.log('key code: ', event.keyCode)
      switch (event.keyCode) {
        case 71: // H for header and hide
          dat.GUI.toggleHide()
          break
      }
    })

    // Add event listener
    window.addEventListener('touchmove', (e) => {
      self.eventHappens(e)
    }, false);
    window.addEventListener('touchstart', (e) => {
      self.eventHappens(e)
    }, false);
    window.addEventListener('mousemove', (e) => {
      self.eventHappens(e)
    }, false);
    // window.addEventListener('mousedown', self.eventHappens, false);

  }

  // Function that returns a raycaster to use to find intersecting objects
  // in a scene given screen pos and a camera, and a projector
  getRayCasterFromScreenCoord(screenX, screenY, camera) {
    var self = this
    var raycaster = new THREE.Raycaster()
    var mouse3D = new THREE.Vector3();
    // Get 3D point form the client x y
    mouse3D.x = (screenX / window.innerWidth) * 2 - 1;
    mouse3D.y = -(screenY / window.innerHeight) * 2 + 1;
    mouse3D.z = 0.5;
    raycaster.setFromCamera(mouse3D, camera)
    return raycaster
  }

  // Add event listener
  eventHappens(e) {
    var self = this
    var mouseCoords = checkIfTouch(e)
    if (self.gplane && self.mouseConstraint) {
      var pos = self.projectOntoPlane(mouseCoords.x, mouseCoords.y, self.gplane, self.camera);
      if (pos) {
        var yDiff = self.mouseDownPos.y - pos.y
        self.setClickMarker(pos.x - yDiff ** 2, pos.y, pos.z, self.scene);
        self.moveJointToPoint(pos.x - yDiff ** 2, pos.y, pos.z);
      }
    }
    // https://stackoverflow.com/questions/38314521/change-color-of-mesh-using-mouseover-in-three-js
    // Get the picking ray from the point. https://jsfiddle.net/wilt/52ejur45/
    // console.log(checkIfTouch(e))
    // return
    var mouseCoords = checkIfTouch(e)
    var raycaster = self.getRayCasterFromScreenCoord(mouseCoords.x, mouseCoords.y, camera);
    // Find the closest intersecting object
    // Now, cast the ray all render objects in the scene to see if they collide. Take the closest one.
    var intersects = raycaster.intersectObjects(self.meshes);

    // Intersected object
    self.intS = self.INTERSECTED
    // self.intersectedObject = self.INTERSECTED // Because intS follows specific hover rules

    // This is where an intersection is detected
    if (intersects.length > 0) {
      if (self.intS != intersects[0].object) {
        // if ( self.intS ) {
        //   self.intS.material.emissive.setHex( self.intS.currentHex );
        // }
        // If it is the plane then nevermind
        if (
          intersects[0].object.name === 'Plane' ||
          intersects[0].object.name === 'Floor'
        ) {
          self.intS = null;
          if (self.showAnnotation) {

            // This part shows the tooltip - start
            self.popover.classList.remove('visible')
            self.playAnnotationAnim('backward')
            // This part shows the tooltip - end

          }
          return
        }
        self.intS = intersects[0].object;
        // self.intS.currentHex = self.intS.material.emissive.getHex();
        // self.intS.material.emissive.setHex( 0xffffff ); // Hover / highlight material
        // Store the intersected id
        // self.currentId = self.intS.userData.id
        // self.currentObj = sounds[self.currentId]

        if (self.showAnnotation) {

          // Log the details
          // console.log(self.intS.name)
          console.log(self.intS)
          const annotationTitleText = document.querySelector('.annotation__title__text')
          annotationTitleText.innerHTML = `${self.intS.name}`

          self.popover.classList.add('visible')
          self.playAnnotationAnim('forward')
        }

        // console.log('intS type: ', self.intS.userData.id)
        // console.log('self.intS: ', self.intS.userData.id)

        // If type of event is mousemove do not play sound. Only on mousedown
        // if (e.type === 'mousedown' || e.type === 'touchstart') {
        //   if (sounds[self.currentId].isPlaying) {
        //     self.stopMusic(self.currentId)
        //   }
        //   else {
        //     self.startMusic(self.currentId)
        //   }
        // }
      }

      // ?? WHere do we detect an object with raycaster?
      self.intersectedObject = self.intS
      // console.log(self.intersectedObject)

      // Change cursor
      document.body.style.cursor = 'pointer'
    }
    else {
      // if ( self.intS ) {
      //   self.intS.material.emissive.setHex( self.intS.currentHex );
      // }
      self.intS = null;
      // self.currentId = null;
      // self.intersectedObject = null;

      if (self.showAnnotation) {
        // alert('should remove')
        self.popover.classList.remove('visible')
        self.playAnnotationAnim('backward')
      }

      // Change cursor
      document.body.style.cursor = 'default'
    }
    // self.highlightShape(closest)
    self.meshes.forEach(element => {
      // console.log(element.material)
      // if (element != self.intS) {
      //   element.material.emissive.setHex( 0x000000 );
      // }
      // console.log(element.currentHex)
    });
  }

  initTooltipAnim() {
    var self = this
    console.log('SplitText')
    console.log(SplitText)
    // return
    // let a = new SplitText("anim-type-axis-y", { type: "lines", linesClass: "lineChild" });
    // let b = new SplitText("anim-type-axis-y", { type: "lines", linesClass: "lineParent" });
    self.tlTooltip = new TimelineMax()
      .to('.info-line', stdTime, { height: '100%', ease: Power3.easeInOut }, 'start')
      // .staggerFrom(".lineChild", 0.75, {y:50}, 0.25)
      .staggerFrom('.anim', stdTime, { y: 20, autoAlpha: 0, ease: Power4.easeInOut }, 0.1, `start+=${stdTime / 2}`)
      .from('.anim--nav-tl', stdTime, { y: -120, autoAlpha: 0, ease: Power4.easeInOut }, 0.1, `start+=${stdTime}`)
      .from('.anim--nav-tr', stdTime, { x: 120, autoAlpha: 0, ease: Power4.easeInOut }, 0.1)
      .from('.anim--nav-br', stdTime, { y: 120, autoAlpha: 0, ease: Power4.easeInOut }, 0.1)
      .from('.anim--nav-bl', stdTime, { x: -120, autoAlpha: 0, ease: Power4.easeInOut }, 0.1)
      .pause()
  }

  playAnnotationAnim(kind) {
    var self = this
    if (kind === 'forward') {
      self.tlTooltip.play()
    }
    else if (kind === 'backward') {
      self.tlTooltip.reverse()
    }
    // .staggerTo(`#${self.content.id} .anim-selfaware`, 2, {autoAlpha: 1, ease: Sine.easeOut}, 0.25)
  }

  updateScreenPosition() {
    var self = this;

    // console.log('update screen position')

    // const vector = new THREE.Vector3(0, 0, 0);
    if (self.intersectedObject === null) {
      return
    }
    var mesh = self.intersectedObject;
    // var mesh = self.meshes[0];
    const vector = mesh.position.clone();
    const canvas = renderer.domElement;

    vector.project(camera);

    vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width / window.devicePixelRatio));
    vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height / window.devicePixelRatio));

    if (self.showAnnotation) {
      // console.log('update screen position')
      // self.annotation.innerHTML = sounds[self.currentId].name;
      // Place little popover
      var popoverAttr = self.popover.getBoundingClientRect();

      self.popover.style.top = `${vector.y - (popoverAttr.height / 2)}px`;
      self.popover.style.left = `${vector.x - (popoverAttr.width / 2)}px`;
    }
  }

  addOrbitControls() {
    // Controls
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    // controls.enablePan = false
    // Set max polar angle
    // controls.maxPolarAngle = (Math.PI * 0.5) * 0.99
    controls.minDistance = 2
    // controls.maxDistance = 100

    controls.addEventListener('change', _ => {
      // console.log('camera pos')
      // console.log(camera.position)
    })
  }

}

const setup = new Setup()
