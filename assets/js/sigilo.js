/* Fundo do hero: fumaça fria de onde se formam sigilos espelhados, como um desenho de cybersigil.
   Tudo é calculado no shader, sem imagem e sem forma desenhada: a fumaça é ruído com domínio torcido;
   os sigilos são as cristas finas de um ruído "ridged", espelhado num eixo vertical (atrás da foto
   no desktop, no meio no celular). Uma faixa de varredura sobe devagar e acende o traço por onde passa,
   e alguns brilhos de quatro pontas, como os da logo, piscam nas cristas.
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
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*ruido(p);p=rot(.6)*p*2.02+vec2(1.7,9.2);a*=.5;}return s;}
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
  vec2 pv=p+vec2(0.,-uFase/TAU*.0);

  /* fumaça: sobe devagar e se torce (offsets em círculo = loop) */
  vec2 q=p*1.6+vec2(0.,-.22)*sin(uFase);
  vec2 w=vec2(fbm(q+c*.28),fbm(q+vec2(5.2,1.3)-c.yx*.28));
  vec2 w2=vec2(fbm(q+w*1.6+vec2(1.7,9.2)+c*.3),fbm(q+w*1.6+vec2(8.3,2.8)-c*.3));
  float fum=fbm(q+w2*1.5);
  float zona=exp(-p.x*p.x*1.3);
  fum=smoothstep(.3,.82,fum*(.6+.45*zona)+zona*.12);

  /* sigilos: dobra fractal espelhada (kaliset). As linhas finas são onde a órbita passa
     rente aos eixos; o parâmetro anda num círculo pequeno, então o ornamento se transforma e volta. */
  vec2 z=vec2(p.x*1.25,(p.y+.12)*.6)*1.3;
  vec2 k=vec2(.82,.62)+vec2(cos(uFase),sin(uFase))*.016;
  float m1=9.,m2=9.;
  for(int i=0;i<6;i++){
    z=abs(z)/max(dot(z,z),.02)-k;
    m1=min(m1,abs(z.y)+.0*abs(z.x));
    m2=min(m2,abs(z.x-z.y*.25));
  }
  float fino=exp(-m1*90.)+exp(-m2*60.)*.5;
  float perto=exp(-p.x*p.x*3.2)*smoothstep(.95,.1,abs(p.y));
  /* a fumaça revela e apaga partes do desenho */
  float rev=smoothstep(.38,.66,fbm(p*1.8+w*1.3-c*.4))*(.35+.65*fum)*.7+.3*smoothstep(.2,.6,fum);
  float traco=clamp(fino,0.,1.5)*rev*perto;

  /* varredura: faixa que sobe e acende o traço */
  float vy=fract(uFase/TAU)*1.5-.25;
  float faixa=exp(-pow((fc.y/uRes.y-vy)*6.,2.));

  vec3 col=vec3(.008,.008,.013);
  col+=uCorB*fum*fum*.9*(.3+.7*perto)+vec3(.7,.72,.85)*pow(fum,4.)*.08;
  col+=uCorA*traco*(1.05+faixa*1.6);
  col+=vec3(.92,.93,1.)*pow(min(traco,1.),2.)*(.35+faixa*.9);

  col+=(h21(fc+floor(uFase*40.)*17.13)-.5)*.016;
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
    gl.uniform3fv(u('uCorA'), cor(op.corA || '#a58cff'));
    gl.uniform3fv(u('uCorB'), cor(op.corB || '#4a36d8'));
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
