/**
 * @author mrdoob / http://mrdoob.com/
 */

import { EventDispatcher } from '../../core/EventDispatcher.js';
import { Group } from '../../objects/Group.js';
import { Matrix4 } from '../../math/Matrix4.js';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { Quaternion } from '../../math/Quaternion.js';
import { ArrayCamera } from '../../cameras/ArrayCamera.js';
import { PerspectiveCamera } from '../../cameras/PerspectiveCamera.js';
import { WebGLAnimation } from '../webgl/WebGLAnimation.js';
import { setProjectionFromUnion } from './WebVRUtils.js';

function WebVRManager( renderer ) {

	const renderWidth, renderHeight;
	const scope = this;

	const device = null;
	const frameData = null;

	const poseTarget = null;

	const controllers = [];
	const standingMatrix = new Matrix4();
	const standingMatrixInverse = new Matrix4();

	const framebufferScaleFactor = 1.0;

	const referenceSpaceType = 'local-floor';

	if ( typeof window !== 'undefined' && 'VRFrameData' in window ) {

		frameData = new window.VRFrameData();
		window.addEventListener( 'vrdisplaypresentchange', onVRDisplayPresentChange, false );

	}

	const matrixWorldInverse = new Matrix4();
	const tempQuaternion = new Quaternion();
	const tempPosition = new Vector3();

	const cameraL = new PerspectiveCamera();
	cameraL.viewport = new Vector4();
	cameraL.layers.enable( 1 );

	const cameraR = new PerspectiveCamera();
	cameraR.viewport = new Vector4();
	cameraR.layers.enable( 2 );

	const cameraVR = new ArrayCamera( [ cameraL, cameraR ] );
	cameraVR.layers.enable( 1 );
	cameraVR.layers.enable( 2 );

	//

	function isPresenting() {

		return device !== null && device.isPresenting === true;

	}

	const currentSize = new Vector2(), currentPixelRatio;

	function onVRDisplayPresentChange() {

		if ( isPresenting() ) {

			const eyeParameters = device.getEyeParameters( 'left' );
			renderWidth = 2 * eyeParameters.renderWidth * framebufferScaleFactor;
			renderHeight = eyeParameters.renderHeight * framebufferScaleFactor;

			currentPixelRatio = renderer.getPixelRatio();
			renderer.getSize( currentSize );

			renderer.setDrawingBufferSize( renderWidth, renderHeight, 1 );

			cameraL.viewport.set( 0, 0, renderWidth / 2, renderHeight );
			cameraR.viewport.set( renderWidth / 2, 0, renderWidth / 2, renderHeight );

			animation.start();

			scope.dispatchEvent( { type: 'sessionstart' } );

		} else {

			if ( scope.enabled ) {

				renderer.setDrawingBufferSize( currentSize.width, currentSize.height, currentPixelRatio );

			}

			animation.stop();

			scope.dispatchEvent( { type: 'sessionend' } );

		}

	}

	//

	const triggers = [];

	function findGamepad( id ) {

		const gamepads = navigator.getGamepads && navigator.getGamepads();

		for ( let i = 0, j = 0, l = gamepads.length; i < l; i ++ ) {

			const gamepad = gamepads[ i ];

			if ( gamepad && ( gamepad.id === 'Daydream Controller' ||
				gamepad.id === 'Gear VR Controller' || gamepad.id === 'Oculus Go Controller' ||
				gamepad.id === 'OpenVR Gamepad' || gamepad.id.startsWith( 'Oculus Touch' ) ||
				gamepad.id.startsWith( 'Spatial Controller' ) ) ) {

				if ( j === id ) return gamepad;

				j ++;

			}

		}

	}

	function updateControllers() {

		for ( let i = 0; i < controllers.length; i ++ ) {

			const controller = controllers[ i ];

			const gamepad = findGamepad( i );

			if ( gamepad !== undefined && gamepad.pose !== undefined ) {

				if ( gamepad.pose === null ) return;

				// Pose

				const pose = gamepad.pose;

				if ( pose.hasPosition === false ) controller.position.set( 0.2, - 0.6, - 0.05 );

				if ( pose.position !== null ) controller.position.fromArray( pose.position );
				if ( pose.orientation !== null ) controller.quaternion.fromArray( pose.orientation );
				controller.matrix.compose( controller.position, controller.quaternion, controller.scale );
				controller.matrix.premultiply( standingMatrix );
				controller.matrix.decompose( controller.position, controller.quaternion, controller.scale );
				controller.matrixWorldNeedsUpdate = true;
				controller.visible = true;

				// Trigger

				const buttonId = gamepad.id === 'Daydream Controller' ? 0 : 1;

				if ( triggers[ i ] === undefined ) triggers[ i ] = false;

				if ( triggers[ i ] !== gamepad.buttons[ buttonId ].pressed ) {

					triggers[ i ] = gamepad.buttons[ buttonId ].pressed;

					if ( triggers[ i ] === true ) {

						controller.dispatchEvent( { type: 'selectstart' } );

					} else {

						controller.dispatchEvent( { type: 'selectend' } );
						controller.dispatchEvent( { type: 'select' } );

					}

				}

			} else {

				controller.visible = false;

			}

		}

	}

	function updateViewportFromBounds( viewport, bounds ) {

		if ( bounds !== null && bounds.length === 4 ) {

			viewport.set( bounds[ 0 ] * renderWidth, bounds[ 1 ] * renderHeight, bounds[ 2 ] * renderWidth, bounds[ 3 ] * renderHeight );

		}

	}

	//

	this.enabled = false;

	this.getController = function ( id ) {

		const controller = controllers[ id ];

		if ( controller === undefined ) {

			controller = new Group();
			controller.matrixAutoUpdate = false;
			controller.visible = false;

			controllers[ id ] = controller;

		}

		return controller;

	};

	this.getDevice = function () {

		return device;

	};

	this.setDevice = function ( value ) {

		if ( value !== undefined ) device = value;

		animation.setContext( value );

	};

	this.setFramebufferScaleFactor = function ( value ) {

		framebufferScaleFactor = value;

	};

	this.setReferenceSpaceType = function ( value ) {

		referenceSpaceType = value;

	};

	this.setPoseTarget = function ( object ) {

		if ( object !== undefined ) poseTarget = object;

	};

	this.getCamera = function ( camera ) {

		const userHeight = referenceSpaceType === 'local-floor' ? 1.6 : 0;

		if ( isPresenting() === false ) {

			camera.position.set( 0, userHeight, 0 );
			camera.rotation.set( 0, 0, 0 );

			return camera;

		}

		device.depthNear = camera.near;
		device.depthFar = camera.far;

		device.getFrameData( frameData );

		//

		if ( referenceSpaceType === 'local-floor' ) {

			const stageParameters = device.stageParameters;

			if ( stageParameters ) {

				standingMatrix.fromArray( stageParameters.sittingToStandingTransform );

			} else {

				standingMatrix.makeTranslation( 0, userHeight, 0 );

			}

		}


		const pose = frameData.pose;
		const poseObject = poseTarget !== null ? poseTarget : camera;

		// We want to manipulate poseObject by its position and quaternion components since users may rely on them.
		poseObject.matrix.copy( standingMatrix );
		poseObject.matrix.decompose( poseObject.position, poseObject.quaternion, poseObject.scale );

		if ( pose.orientation !== null ) {

			tempQuaternion.fromArray( pose.orientation );
			poseObject.quaternion.multiply( tempQuaternion );

		}

		if ( pose.position !== null ) {

			tempQuaternion.setFromRotationMatrix( standingMatrix );
			tempPosition.fromArray( pose.position );
			tempPosition.applyQuaternion( tempQuaternion );
			poseObject.position.add( tempPosition );

		}

		poseObject.updateMatrixWorld();

		//

		cameraL.near = camera.near;
		cameraR.near = camera.near;

		cameraL.far = camera.far;
		cameraR.far = camera.far;

		cameraL.matrixWorldInverse.fromArray( frameData.leftViewMatrix );
		cameraR.matrixWorldInverse.fromArray( frameData.rightViewMatrix );

		// TODO (mrdoob) Double check this code

		standingMatrixInverse.getInverse( standingMatrix );

		if ( referenceSpaceType === 'local-floor' ) {

			cameraL.matrixWorldInverse.multiply( standingMatrixInverse );
			cameraR.matrixWorldInverse.multiply( standingMatrixInverse );

		}

		const parent = poseObject.parent;

		if ( parent !== null ) {

			matrixWorldInverse.getInverse( parent.matrixWorld );

			cameraL.matrixWorldInverse.multiply( matrixWorldInverse );
			cameraR.matrixWorldInverse.multiply( matrixWorldInverse );

		}

		// envMap and Mirror needs camera.matrixWorld

		cameraL.matrixWorld.getInverse( cameraL.matrixWorldInverse );
		cameraR.matrixWorld.getInverse( cameraR.matrixWorldInverse );

		cameraL.projectionMatrix.fromArray( frameData.leftProjectionMatrix );
		cameraR.projectionMatrix.fromArray( frameData.rightProjectionMatrix );

		setProjectionFromUnion( cameraVR, cameraL, cameraR );

		//

		const layers = device.getLayers();

		if ( layers.length ) {

			const layer = layers[ 0 ];

			updateViewportFromBounds( cameraL.viewport, layer.leftBounds );
			updateViewportFromBounds( cameraR.viewport, layer.rightBounds );

		}

		updateControllers();

		return cameraVR;

	};

	this.getStandingMatrix = function () {

		return standingMatrix;

	};

	this.isPresenting = isPresenting;

	// Animation Loop

	const animation = new WebGLAnimation();

	this.setAnimationLoop = function ( callback ) {

		animation.setAnimationLoop( callback );

		if ( isPresenting() ) animation.start();

	};

	this.submitFrame = function () {

		if ( isPresenting() ) device.submitFrame();

	};

	this.dispose = function () {

		if ( typeof window !== 'undefined' ) {

			window.removeEventListener( 'vrdisplaypresentchange', onVRDisplayPresentChange );

		}

	};

	// DEPRECATED

	this.setFrameOfReferenceType = function () {

		console.warn( 'THREE.WebVRManager: setFrameOfReferenceType() has been deprecated.' );

	};

}

Object.assign( WebVRManager.prototype, EventDispatcher.prototype );

export { WebVRManager };
