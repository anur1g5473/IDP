import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DigitalTwin3D({ signalA, signalB, countA, countB }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = 220;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0E0A1A);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 25, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Road Ground
    const roadGeo = new THREE.BoxGeometry(8, 0.2, 45);
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x1D1233 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    scene.add(road);

    // Underpass Walls / Tunnel Arches (Brutalist style)
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x593C8F, wireframe: true });
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 45), wallMat);
    wallLeft.position.set(-4.25, 3, 0);
    scene.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 45), wallMat);
    wallRight.position.set(4.25, 3, 0);
    scene.add(wallRight);

    // Signal Lamps Spheres
    const sigMatA = new THREE.MeshBasicMaterial({ color: 0xFF3B30 });
    const signalMeshA = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 16), sigMatA);
    signalMeshA.position.set(-5.5, 4, -18);
    scene.add(signalMeshA);

    const sigMatB = new THREE.MeshBasicMaterial({ color: 0xFF3B30 });
    const signalMeshB = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 16), sigMatB);
    signalMeshB.position.set(5.5, 4, 18);
    scene.add(signalMeshB);

    // Dynamic Vehicle Glowing Blocks Group
    const vehiclesGroup = new THREE.Group();
    scene.add(vehiclesGroup);

    let animId;
    const animate = () => {
      // Rotate camera subtly
      scene.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      roadGeo.dispose();
      roadMat.dispose();
      wallMat.dispose();
      sigMatA.dispose();
      sigMatB.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '220px',
          border: '2px solid var(--royal-plum)',
          boxShadow: 'inset 0 0 10px #000',
          overflow: 'hidden'
        }}
      />
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        backgroundColor: 'rgba(10,6,18,0.85)',
        border: '1px solid var(--mint-mist)',
        padding: '3px 8px',
        fontSize: '0.65rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--mint-mist)',
        boxShadow: '2px 2px 0px #000'
      }}>
        3D DIGITAL TWIN (LIVE SYNC)
      </div>
    </div>
  );
}
