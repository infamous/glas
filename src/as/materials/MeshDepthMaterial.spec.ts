/**
 * @author jbbe / https://github.com/jbbe
 */

import {MeshDepthMaterial} from './MeshDepthMaterial'

describe('Materials', () => {
	describe('MeshDepthMaterial', () => {
		test('type', () => {
			const mat = new MeshDepthMaterial()
			expect(mat.type).toBe('MeshDepthMaterial', 'it should be true')
		})

		todo('copy')
	})
})
