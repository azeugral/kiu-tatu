/* Fundo do hero: fumaça violeta espelhada, cortada por veios de tinta preta.
   Tudo é calculado no shader, sem imagem e sem forma desenhada: a fumaça é ruído com domínio torcido,
   a fumaça é espelhada num eixo vertical (atrás da foto no desktop, no meio no celular), o que dá a
   simetria de um desenho de cybersigil sem desenhar nada; veios finos de tinta preta cortam a fumaça.
   sigiloGL(canvas, {eixo}) -> {tamanho(w,h), desenhar(fase)}; fase em [0, 2π) fecha o loop sem emenda.
   O mesmo shader gera os MP4 do celular (tools/gerar_video.py). */
(function (g) {
  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uFase; uniform float uEixo;
uniform vec3 uCorA; uniform vec3 uCorB;
#define TAU 6.28318530718

float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
vec2 h22(vec2 p){float n=h21(p);return vec2(n,h21(p+n+17.1));}
float ruido(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<6;i++){s+=a*ruido(p);p=rot(.6)*p*2.02+vec2(1.7,9.2);a*=.5;}return s;}
/* cristas finas e pontudas: 1-|2n-1| elevado, oitavas cada vez mais finas */
float crista(vec2 p){float s=0.,a=.6,pe=1.;
  for(int i=0;i<4;i++){float n=1.-abs(ruido(p)*2.-1.);n=pow(n,4.);s+=a*n*(.35+.65*pe);pe=n;p=rot(-.5)*p*2.1+vec2(3.1,.7);a*=.55;}
  return s;}

void main(){
  vec2 fc=gl_FragCoord.xy;
  float esc=min(uRes.x,uRes.y);
  vec2 c=vec2(cos(uFase),sin(uFase));
  /* espelho: x vira a distância até o eixo */
  float ex=uEixo*uRes.x;
  vec2 p=vec2(abs(fc.x-ex),fc.y-.5*uRes.y)/esc;

  /* fumaça: sobe devagar e se torce (offsets em círculo = loop) */
  vec2 q=p*1.45+vec2(0.,-.22)*sin(uFase);
  vec2 w=vec2(fbm(q+c*.28),fbm(q+vec2(5.2,1.3)-c.yx*.28));
  vec2 w2=vec2(fbm(q+w*1.6+vec2(1.7,9.2)+c*.3),fbm(q+w*1.6+vec2(8.3,2.8)-c*.3));
  float f0=fbm(q+w2*1.5);
  float zona=exp(-p.x*p.x*1.1)*smoothstep(1.25,.1,abs(p.y));
  float fum=smoothstep(.28,.85,f0*(.62+.42*zona)+zona*.1);
  /* miolo mais claro onde a fumaça adensa */
  float miolo=smoothstep(.55,.95,f0+zona*.12)*fum;

  /* veios de tinta preta: cristas finas arrastadas pelo mesmo fluxo da fumaça */
  float vt=crista(q*1.1+w2*1.25-c*.12);
  float veio=smoothstep(.36,.72,vt)*smoothstep(.08,.4,fum);
  /* bolsões escuros onde o fluxo dobra */
  float bolsao=smoothstep(.42,.2,length(w2-w))*.55;

  vec3 col=vec3(.006,.006,.01);
  /* fios: filamentos finos e claros que a fumaça estica */
  float fio=smoothstep(.55,1.,crista(q*2.6+w2*2.1+c*.15))*fum;
  col+=uCorB*pow(fum,1.8)*1.7*(.3+.7*zona);
  col+=uCorA*miolo*1.15*(.45+.55*zona);
  col+=uCorA*fio*.9*(.4+.6*zona);
  col+=vec3(.9,.86,1.)*(pow(miolo,2.5)*.35+fio*fio*.35)*zona;
  col*=1.-clamp(veio*.92+bolsao*fum,0.,.96);

  /* dither (interleaved gradient noise): tira o degrau do gradiente escuro sem desenhar padrão */
  vec2 gq=fc+vec2(5.588,2.37)*floor(fract(uFase*7.)*64.);
  col+=(fract(52.9829189*fract(dot(gq,vec2(.06711056,.00583715))))-.5)*.012;
  col=1.-exp(-col*1.4);
  gl_FragColor=vec4(max(col,0.),1.);
}`;

  g.sigiloGL = function (cv, op = {}) {
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: !!op.preserveDrawingBuffer, powerPreference: 'low-power' });
    if (!gl) return null;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const u = n => gl.getUniformLocation(pr, n);
    const uR = u('uRes'), uF = u('uFase'), uE = u('uEixo');
    const cor = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255);
    gl.uniform3fv(u('uCorA'), cor(op.corA || '#b27cff'));
    gl.uniform3fv(u('uCorB'), cor(op.corB || '#5e26c9'));
    return {
      tamanho(w, h) { cv.width = w; cv.height = h; },
      desenhar(fase, eixo) {
        gl.viewport(0, 0, cv.width, cv.height);
        gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uF, fase); gl.uniform1f(uE, eixo ?? op.eixo ?? .5);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  };
})(window);
