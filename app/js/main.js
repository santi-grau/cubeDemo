import { Scene, WebGLRenderer, PerspectiveCamera, Mesh, MeshBasicMaterial, PlaneGeometry, SphereGeometry, OrthographicCamera, WebGLRenderTarget, Object3D, BufferGeometry, BufferAttribute, Color } from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js"

class TextureTarget extends WebGLRenderTarget {
    constructor(size, renderer) {
        super(size, size)
        this.renderer = renderer
        this.scene = new Scene()
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 10)
        this.camera.position.z = 5

        this.planeGroup = new Object3D()
        this.sphereGroup = new Object3D()
        this.scene.add(this.planeGroup, this.sphereGroup)
        for (let i = 0; i < 6; i++) {
            this.sphereGroup.add(new Mesh(new SphereGeometry(0.1), new MeshBasicMaterial({ color: Math.random() * 0xffffff })))
            this.planeGroup.add(new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial({ color: new Color("hsl( 0, 0%, " + Math.floor(Math.random() * 30) + "% )") })))
            this.planeGroup.children[i].position.set((i % 3) / 1.5 - 2 / 3, Math.floor(i / 3) / 1.5 - 2 / 6)
            this.planeGroup.children[i].scale.set(1 / 3, 1 / 3, 1)
        }

        this.effectComposer = new EffectComposer(this.renderer)
        this.effectComposer.setSize(size, size)

        this.effectComposer.addPass(new RenderPass(this.scene, this.camera))

        this.effectComposer.addPass(new AfterimagePass(0.97))
        this.effectComposer.renderToScreen = false
    }

    step(t) {
        this.sphereGroup.children.forEach((o, i) => {
            o.position.x = Math.sin(t * 0.001 + (i / 6) * Math.PI * 2) / 6 + ((i % 3) / 1.5 - 2 / 3)
            o.position.y = Math.cos(t * 0.001 - (i / 6) * Math.PI * 2) / 6 + (Math.floor(i / 3) / 1.5 - 2 / 6)
        })

        this.renderer.setRenderTarget(this)
        this.effectComposer.render()
        this.renderer.setRenderTarget(null)
        this.effectComposer.swapBuffers()
    }
}

class AppMain extends HTMLElement {
    connectedCallback() {
        this.camera = new PerspectiveCamera()
        this.scene = new Scene()
        this.renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
        this.appendChild(this.renderer.domElement)

        this.rt = new TextureTarget(8192, this.renderer)

        const boxGeometry = new BufferGeometry()
        let n = -1, vs = [1, 1, n, 1, 1, n, 1, 1, n, 1, n, n, 1, n, n, 1, n, n, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, n, 1, 1, n, 1, 1, n, 1, n, 1, n, n, 1, n, n, 1, n, n, n, n, n, n, n, n, n, n, n, 1, 1, n, 1, 1, n, 1, 1, n, n, 1, n, n, 1, n, n, 1]
        let f = 1 / 3, f2 = 2 / 3, f3 = 5 / 6, f4 = 1 / 6, h = 0.5, uvs = [f, h, f, h, f2, h, 0, h, f, h, 1, f3, f, f4, f, f4, 1, h, 0, f4, f2, h, 1, h, f, h, f2, h, f2, f3, 0, h, f, f3, f2, f3, f, f3, f2, f4, 1, f4, 0, f3, f2, f4, f2, h]
        let ids = [0, 13, 19, 0, 19, 6, 10, 8, 20, 10, 20, 22, 21, 18, 12, 21, 12, 15, 17, 5, 11, 17, 11, 23, 3, 1, 7, 3, 7, 9, 16, 14, 2, 16, 2, 4]
        boxGeometry.setAttribute("position", new BufferAttribute(new Float32Array(vs), 3))
        boxGeometry.setIndex(new BufferAttribute(new Uint16Array(ids), 1))
        boxGeometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2))
        this.cube = new Mesh(boxGeometry, new MeshBasicMaterial({ map: this.rt.effectComposer.writeBuffer.texture }))
        this.cube.scale.set(0.5, 0.5, 0.5)
        this.scene.add(this.cube)

        this.onResize()
        window.addEventListener("resize", () => this.onResize())
        requestAnimationFrame((t) => this.step(t))
    }

    onResize() {
        var [width, height] = [this.offsetWidth, this.offsetHeight]
        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio * 2))
        var camView = { fov: 6, aspect: width / height, near: 0.01, far: 100 }
        for (var prop in camView) this.camera[prop] = camView[prop]
        if (height < width) this.camera.position.z = 1 / Math.tan((Math.PI * this.camera.fov) / 360)
        else this.camera.position.z = height / width / Math.tan((Math.PI * this.camera.fov) / 360)
        this.camera.updateProjectionMatrix()
    }

    step(t) {
        requestAnimationFrame((t) => this.step(t))

        this.cube.rotation.y += 0.005
        this.cube.rotation.x += 0.0075
        this.cube.rotation.z += 0.0025

        this.rt.step(t)
        this.renderer.render(this.scene, this.camera)
    }
}

window.customElements.define("app-main", AppMain)
