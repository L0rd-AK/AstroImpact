import React, { Suspense } from 'react';
import { Alert, Spinner } from 'react-bootstrap';

// Lazy load 3D components to avoid loading issues
const Earth3D = React.lazy(() => 
  import('./Earth3D').catch(err => {
    console.error('Failed to load Earth3D:', err);
    return { default: () => <div>3D Earth view unavailable</div> };
  })
);

const Asteroid3D = React.lazy(() => 
  import('./Asteroid3D').catch(err => {
    console.error('Failed to load Asteroid3D:', err);
    return { default: () => <div>3D Asteroid view unavailable</div> };
  })
);

const Impact3D = React.lazy(() => 
  import('./Impact3D').catch(err => {
    console.error('Failed to load Impact3D:', err);
    return { default: () => <div>3D Impact view unavailable</div> };
  })
);

const EnhancedImpact3D = React.lazy(() => 
  import('./WorkingEnhancedImpact3D').catch(err => {
    console.error('Failed to load WorkingEnhancedImpact3D:', err);
    // Fallback to regular Impact3D if enhanced version fails
    return import('./Impact3D').catch(() => ({
      default: () => <div>3D Impact view unavailable</div>
    }));
  })
);

// Loading fallback component
const ThreeJSLoader = () => (
  <div 
    className="d-flex flex-column align-items-center justify-content-center"
    style={{ height: '100%', background: '#000' }}
  >
    <Spinner animation="border" variant="primary" className="mb-3" />
    <div style={{ color: '#ffffff', textAlign: 'center' }}>
      <div>Loading 3D Environment...</div>
      <small style={{ color: '#cccccc' }}>
        Initializing Three.js renderer and shaders
      </small>
    </div>
  </div>
);

// Error boundary for 3D components
class ThreeJSErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Visualization Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="d-flex flex-column align-items-center justify-content-center p-4"
          style={{ height: '100%', background: '#000' }}
        >
          <Alert variant="warning" className="text-center">
            <Alert.Heading>
              <i className="bi bi-exclamation-triangle me-2"></i>
              3D Visualization Unavailable
            </Alert.Heading>
            <p>
              The 3D visualization feature requires WebGL support and Three.js libraries.
              Please try refreshing the page or use the 2D map view.
            </p>
            <hr />
            <div className="d-flex gap-2 justify-content-center">
              <button 
                className="btn btn-outline-warning btn-sm"
                onClick={() => this.setState({ hasError: false })}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Retry
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh Page
              </button>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapped components with error handling
export const SafeEarth3D = (props) => (
  <ThreeJSErrorBoundary>
    <Suspense fallback={<ThreeJSLoader />}>
      <Earth3D {...props} />
    </Suspense>
  </ThreeJSErrorBoundary>
);

export const SafeAsteroid3D = (props) => (
  <ThreeJSErrorBoundary>
    <Suspense fallback={<ThreeJSLoader />}>
      <Asteroid3D {...props} />
    </Suspense>
  </ThreeJSErrorBoundary>
);

export const SafeImpact3D = (props) => (
  <ThreeJSErrorBoundary>
    <Suspense fallback={<ThreeJSLoader />}>
      <Impact3D {...props} />
    </Suspense>
  </ThreeJSErrorBoundary>
);

export const SafeEnhancedImpact3D = (props) => (
  <ThreeJSErrorBoundary>
    <Suspense fallback={<ThreeJSLoader />}>
      <EnhancedImpact3D {...props} />
    </Suspense>
  </ThreeJSErrorBoundary>
);

// Feature detection
export const is3DSupported = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
};

const ThreeJSComponents = { SafeEarth3D, SafeAsteroid3D, SafeImpact3D, SafeEnhancedImpact3D, is3DSupported };
export default ThreeJSComponents;
