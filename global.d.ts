// Type declarations for static asset imports used by the app
// Keeps TypeScript from complaining about side-effect imports like `import './globals.css'`.

declare module '*.css';
declare module '*.scss';
declare module '*.sass';

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.webp';

declare module '*.avif';

declare module '*.woff';
declare module '*.woff2';
declare module '*.eot';
declare module '*.ttf';
declare module '*.otf';
