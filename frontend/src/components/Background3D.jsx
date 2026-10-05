import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Background3D({ lowPower, currentMode, fsmState }) {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    let canvas;
    try {
      canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL not supported');
    } catch (e) {
      console.warn('WebGL unavailable, falling back to CSS background.');
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0A0612, 0.025);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0A0612, 1);
    container.appendChild(renderer.domElement);

    // Particle field geometry
    const particleCount = lowPower ? 1200 : 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const plumColor = new THREE.Color(0x593C8F);
    const mintColor = new THREE.Color(0xA8D5BA);
    const creamColor = new THREE.Color(0xFAF6EE);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;

      const mix = Math.random();
      const c = mix < 0.6 ? plumColor : mix < 0.9 ? mintColor : creamColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: lowPower ? 0.35 : 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Wireframe Tunnel Grid
    const tunnelGeo = new THREE.CylinderGeometry(15, 15, 120, 16, 20, true);
    const tunnelMat = new THREE.MeshBasicMaterial({
      color: 0x593C8F,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.rotation.x = Math.PI / 2;
    scene.add(tunnel);

    let animationFrameId;
    let isTabVisible = true;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let speed = 0.15;
    const animate = () => {
      if (isTabVisible) {
        // Adjust speed/color on emergency
        const isEmergency = fsmState === 'EMERGENCY_ALL_RED';
        const targetSpeed = isEmergency ? 0.4 : 0.15;
        speed += (targetSpeed - speed) * 0.05;

        // Tunnel rotation and flow
        tunnel.rotation.z += 0.002;
        
        const posAttr = geometry.attributes.position;
        const posArray = posAttr.array;

        for (let i = 0; i < particleCount; i++) {
          posArray[i * 3 + 2] += speed;
          if (posArray[i * 3 + 2] > 20) {
            posArray[i * 3 + 2] = -100;
          }
        }
        posAttr.needsUpdate = true;

        // Parallax mouse tilt
        camera.position.x += (mouseRef.current.x * 2 - camera.position.x) * 0.05;
        camera.position.y += (-mouseRef.current.y * 2 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, -40);

        if (isEmergency) {
          tunnelMat.color.setHex(0xFF3B30);
          tunnelMat.opacity = 0.35;
        } else {
          tunnelMat.color.setHex(0x593C8F);
          tunnelMat.opacity = 0.15;
        }

        renderer.render(scene, camera);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      tunnelGeo.dispose();
      tunnelMat.dispose();
      renderer.dispose();
    };
  }, [lowPower, fsmState]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
}
