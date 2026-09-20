import { useEffect, useRef } from 'react';
import { loadThree, prefersReducedMotion } from '../lib/motion';

/**
 * Cinematic-but-restrained 3D railway scene:
 *  - two parallel rails with sleepers stretching to the horizon
 *  - a low-poly passenger train with warm saffron coach windows
 *  - subtle station pillars + atmospheric fog
 *  - camera drifts slowly; scroll position subtly advances the train
 * Fully disposes GPU resources on unmount. Skipped for reduced-motion users
 * (the host component renders the SVG fallback instead).
 */
const HeroScene3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    loadThree().then((THREE) => {
      if (disposed || !mountRef.current) return;
      const mount = mountRef.current;

      // ---- Renderer / scene / camera -------------------------------------
      const DPR_CAP = 1.75;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_CAP));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xfaf7f1, 60, 190);

      const camera = new THREE.PerspectiveCamera(
        42,
        mount.clientWidth / mount.clientHeight,
        0.1,
        400
      );
      camera.position.set(0, 7.5, 26);
      camera.lookAt(0, 3, -30);

      // ---- Lighting -------------------------------------------------------
      const hemi = new THREE.HemisphereLight(0xfff6e8, 0xd8d0be, 0.95);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xffe9c4, 1.05);
      sun.position.set(-18, 26, 12);
      scene.add(sun);
      const rim = new THREE.DirectionalLight(0xd8d0be, 0.35);
      rim.position.set(16, 10, -24);
      scene.add(rim);

      // ---- Materials ------------------------------------------------------
      const ivory = new THREE.MeshStandardMaterial({ color: 0xf4efe5, roughness: 0.9 });
      const inkMat = new THREE.MeshStandardMaterial({ color: 0x23201b, roughness: 0.55, metalness: 0.15 });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x9da199, roughness: 0.35, metalness: 0.7 });
      const saffronMat = new THREE.MeshStandardMaterial({
        color: 0xedd79e,
        emissive: 0xc2913a,
        emissiveIntensity: 0.45,
        roughness: 0.4,
      });
      const crimsonMat = new THREE.MeshStandardMaterial({ color: 0x971c26, roughness: 0.5 });

      // ---- Track ----------------------------------------------------------
      const track = new THREE.Group();
      const railGeo = new THREE.BoxGeometry(0.16, 0.16, 320);
      const railL = new THREE.Mesh(railGeo, steelMat);
      railL.position.set(-2.1, 0.1, -120);
      const railR = new THREE.Mesh(railGeo, steelMat);
      railR.position.set(2.1, 0.1, -120);
      track.add(railL, railR);

      const sleeperGeo = new THREE.BoxGeometry(6.2, 0.22, 0.5);
      const sleepers = new THREE.InstancedMesh(sleeperGeo, inkMat, 80);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < 80; i++) {
        m4.setPosition(0, 0, 8 - i * 4);
        sleepers.setMatrixAt(i, m4);
      }
      track.add(sleepers);
      scene.add(track);

      // ---- Ballast bed ----------------------------------------------------
      const bed = new THREE.Mesh(new THREE.BoxGeometry(11, 0.4, 320), ivory);
      bed.position.set(0, -0.22, -120);
      scene.add(bed);

      // ---- Train ----------------------------------------------------------
      const train = new THREE.Group();
      const noseGeo = new THREE.BoxGeometry(3.6, 3.4, 7);
      noseGeo.translate(0, 0, -3.5);
      const nose = new THREE.Mesh(noseGeo, inkMat);
      train.add(nose);

      // Windshield band
      const shield = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.0, 0.18), saffronMat);
      shield.position.set(0, 0.7, -6.9);
      train.add(shield);

      // Coaches with warm windows
      const winGeo = new THREE.BoxGeometry(3.0, 0.9, 0.16);
      for (let c = 0; c < 4; c++) {
        const coach = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.2, 10.5), inkMat);
        coach.position.set(0, 0, 5.5 + c * 11.2);
        train.add(coach);
        for (let w = 0; w < 4; w++) {
          const win = new THREE.Mesh(winGeo, saffronMat);
          win.position.set(0, 0.55, 1.6 + w * 2.5 + c * 11.2);
          train.add(win);
        }
        // Crimson stripe
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.44, 0.28, 10.54), crimsonMat);
        stripe.position.set(0, -0.9, 5.5 + c * 11.2);
        train.add(stripe);
      }

      // Bogies
      const bogieGeo = new THREE.BoxGeometry(2.6, 0.5, 2.2);
      [-3.2, 3.2].forEach((dz) => {
        const b1 = new THREE.Mesh(bogieGeo, steelMat);
        b1.position.set(0, -1.7, dz);
        train.add(b1);
        [-3.2, 3.2].forEach((dz2) => {
          const b2 = new THREE.Mesh(bogieGeo, steelMat);
          b2.position.set(0, -1.7, dz2 + 11.2 * 1.6);
          train.add(b2);
        });
      });

      train.position.set(0, 2.15, 6);
      train.rotation.y = Math.PI; // face away, heading down the line
      scene.add(train);

      // ---- Station pillars (subtle) ---------------------------------------
      const pillarGeo = new THREE.BoxGeometry(0.5, 9, 0.5);
      const canopyGeo = new THREE.BoxGeometry(2.2, 0.3, 14);
      for (let i = 0; i < 3; i++) {
        const z = -26 - i * 34;
        const p1 = new THREE.Mesh(pillarGeo, ivory);
        p1.position.set(-7.5, 4.5, z);
        const p2 = new THREE.Mesh(pillarGeo, ivory);
        p2.position.set(7.5, 4.5, z);
        const canopy = new THREE.Mesh(canopyGeo, ivory);
        canopy.position.set(0, 9.1, z);
        scene.add(p1, p2, canopy);
      }

      // ---- Animation ------------------------------------------------------
      let raf = 0;
      let t = 0;
      let scrollBoost = 0;
      const onScroll = () => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        scrollBoost = (window.scrollY / max) * 26; // subtle scroll response
      };
      window.addEventListener('scroll', onScroll, { passive: true });

      const clock = new THREE.Clock();
      const animate = () => {
        if (disposed) return;
        raf = requestAnimationFrame(animate);
        const dt = clock.getDelta();
        t += dt;

        // Slow camera drift along the platform
        camera.position.x = Math.sin(t * 0.18) * 1.6;
        camera.position.y = 7.5 + Math.sin(t * 0.12) * 0.35;
        camera.lookAt(0, 3, -30);

        // Train rolls forward, wrapped; scroll nudges it ahead
        const speed = 4.2;
        train.position.z = 6 - ((t * speed + scrollBoost) % 90);
        // Wheel-free subtle bob
        train.position.y = 2.15 + Math.sin(t * 9) * 0.015;

        renderer.render(scene, camera);
      };
      animate();

      // ---- Resize ---------------------------------------------------------
      const onResize = () => {
        if (!mount.clientWidth) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      };
      window.addEventListener('resize', onResize);

      // ---- Cleanup --------------------------------------------------------
      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => m.dispose());
          }
        });
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
};

export default HeroScene3D;
