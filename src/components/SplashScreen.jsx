import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useTheme } from '../contexts/ThemeContext';
import '@/styles/SplashScreen.css';

export default function SplashScreen({ onComplete }) {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const progressTextRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(containerRef.current, { display: 'none' });
        onComplete();
      }
    });

    // Initial state
    gsap.set([progressRef.current, progressTextRef.current], { 
      opacity: 0,
      width: 0 
    });

    // Animation sequence
    tl.to(progressRef.current, {
      opacity: 1,
      duration: 0.6
    })
    .to(progressRef.current, {
      width: '100%',
      duration: 3.2,
      ease: "power1.out",
      onUpdate: function() {
        const progress = Math.round(this.progress() * 100);
        progressTextRef.current.textContent = `${progress}%`;
      }
    })
    .to(progressTextRef.current, {
      opacity: 1,
      duration: 0.3
    }, 0)
    .to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.in"
    }, "+=0.3");

    return () => {
      tl.kill();
      gsap.killTweensOf([progressRef.current, progressTextRef.current, containerRef.current]);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${theme}`} ref={containerRef}>
      <div className="splash-content">
        <div className="lottie-animation">
          <DotLottieReact
            src="/animations/shopping-cart.json"
            loop
            autoplay
            style={{
              width: '90%',
              height: '90%',
              display: 'flex',
            }}
          />
        </div>

        <div className="progress-wrapper">
          <div className="progress-container">
            <div className="progress-bar" ref={progressRef}></div>
          </div>
          <span className="progress-text" ref={progressTextRef}>0%</span>
        </div>

        <div className="brand-text">Gère Ma Boutique</div>
      </div>
    </div>
  );
}
