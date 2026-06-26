import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Fallback point cloud globe in case texture fails to load (e.g. offline)
function FallbackGlobe() {
  const pointsRef = useRef();
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.08;
    }
  });

  const count = 1500;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const r = 2.2;
      arr[i * 3] = Math.cos(theta) * radius * r;
      arr[i * 3 + 1] = y * r;
      arr[i * 3 + 2] = Math.sin(theta) * radius * r;
    }
    return arr;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#888888" size={0.03} sizeAttenuation transparent opacity={0.4} />
    </points>
  );
}

// Ultra-premium Textured Earth Night Globe
function TexturedGlobe() {
  const earthLights = useTexture('https://unpkg.com/three-globe/example/img/earth-night.jpg');
  const globeRef = useRef();

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = state.clock.getElapsedTime() * 0.06;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Earth sphere */}
      <mesh>
        <sphereGeometry args={[2.2, 64, 64]} />
        <meshStandardMaterial
          color="#060913"
          map={earthLights}
          emissive={new THREE.Color('#ffffff')}
          emissiveMap={earthLights}
          emissiveIntensity={2.5}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Equatorial ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.205, 2.21, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Satellite with Orbit Path
function Satellite() {
  const satelliteRef = useRef();
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (satelliteRef.current) {
      const angle = elapsed * 0.08;
      const x = Math.cos(angle) * 3.3;
      const z = Math.sin(angle) * 3.3;
      const y = Math.sin(angle) * 1.3;
      satelliteRef.current.position.set(x, y, z);
      satelliteRef.current.lookAt(0, 0, 0);
    }
  });
  return (
    <group>
      <mesh rotation={[Math.PI / 3.5, 0, 0]}>
        <ringGeometry args={[3.295, 3.3, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
      <group ref={satelliteRef}>
        <mesh>
          <boxGeometry args={[0.12, 0.12, 0.18]} />
          <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0.26, 0, 0]}>
          <boxGeometry args={[0.3, 0.01, 0.09]} />
          <meshBasicMaterial color="#1e40af" />
        </mesh>
        <mesh position={[-0.26, 0, 0]}>
          <boxGeometry args={[0.3, 0.01, 0.09]} />
          <meshBasicMaterial color="#1e40af" />
        </mesh>
      </group>
    </group>
  );
}

export default function RadarGlobe() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cameraDistance = isMobile ? 8.2 : 7.2;

  return (
    <div className="w-full h-[300px] xs:h-[360px] sm:h-[480px] lg:h-[600px] relative overflow-visible">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, cameraDistance], fov: 43 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[-8, 6, 10]} intensity={1.2} />
        <pointLight position={[8, -4, -6]} intensity={0.4} color="#1e40af" />
        
        <Suspense fallback={<FallbackGlobe />}>
          <TexturedGlobe />
        </Suspense>

        <Satellite />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3.5}
        />
      </Canvas>

      {/* Active Units Status Overlay */}
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 font-mono text-[8px] sm:text-[9px] bg-slate-950/65 border border-white/5 p-2.5 sm:p-4 rounded-xl backdrop-blur-md flex flex-col gap-1.5 sm:gap-2 pointer-events-none select-none shadow-lg w-[130px] sm:w-44">
        <div className="text-white/40 font-bold uppercase tracking-wider border-b border-white/5 pb-1 text-[7px] sm:text-[9px]">
          ACTIVE UNITS
        </div>
        <div className="flex justify-between items-center text-white/70">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            Police
          </span>
          <span className="font-bold">128</span>
        </div>
        <div className="flex justify-between items-center text-white/70">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Medical
          </span>
          <span className="font-bold">96</span>
        </div>
        <div className="flex justify-between items-center text-white/70">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            Fire Brigade
          </span>
          <span className="font-bold">72</span>
        </div>
        <div className="border-t border-white/5 pt-1.5 flex justify-between items-center text-white">
          <span className="font-semibold text-white/50">Total Units</span>
          <span className="font-bold">296</span>
        </div>
      </div>
    </div>
  );
}
