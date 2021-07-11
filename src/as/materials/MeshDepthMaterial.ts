import {Material} from './Material.js'
import {BasicDepthPacking, DepthPackingStrategies} from '../constants.js'
import {Texture} from '../textures/Texture.js'

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author bhouston / https://clara.io
 * @author WestLangley / http://github.com/WestLangley
 *
 * parameters = {
 *
 *  opacity: <float>,
 *
 *  map: new THREE.Texture( <Image> ),
 *
 *  alphaMap: new THREE.Texture( <Image> ),
 *
 *  displacementMap: new THREE.Texture( <Image> ),
 *  displacementScale: <float>,
 *  displacementBias: <float>,
 *
 *  wireframe: <boolean>,
 *  wireframeLinewidth: <float>
 * }
 */

//  export interface MeshDepthMaterialParameters extends MaterialParameters {
// 	depthPacking?: DepthPackingStrategies
// 	displacementMap?: Texture
// 	displacementScale?: f32
// 	displacementBias?: f32
// 	wireframe?: boolean
// 	wireframeLinewidth?: f32
// }

export class MeshDepthMaterial extends Material {
	isMeshDepthMaterial = true

	depthPacking: DepthPackingStrategies = BasicDepthPacking

	skinning: Boolean = false
	morphTargets: Boolean = false

	map: Texture | null = null

	alphaMap: Texture | null = null

	displacementMap: Texture | null = null
	displacementScale: f32 = 1
	displacementBias: f32 = 0

	wireframe: boolean = false
	wireframeLinewidth: f32 = 1

	fog: boolean = false
	lights: boolean = false

	constructor(/*parameters: MeshDepthMaterialParameters*/) {
		super()
		this.type = 'MeshDepthMaterial'
	}

    /**
	 * Copy the properties from the passed material into this material.
	 */
	copy(source: MeshDepthMaterial): this {
		Material.prototype.copy.call(this, source)

		this.depthPacking = source.depthPacking

		this.skinning = source.skinning
		this.morphTargets = source.morphTargets

		this.map = source.map

		this.alphaMap = source.alphaMap

		this.displacementMap = source.displacementMap
		this.displacementScale = source.displacementScale
		this.displacementBias = source.displacementBias

		this.wireframe = source.wireframe
		this.wireframeLinewidth = source.wireframeLinewidth

		return this
	}
}
