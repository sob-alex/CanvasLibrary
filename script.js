let liba = (function () {
  const ctx = document.querySelector('canvas').getContext('2d');
  const canvasHeight = ctx.canvas.clientHeight;
  const canvasWidth = ctx.canvas.clientWidth;
  const Application = {};

  document.querySelector('canvas').addEventListener('click', (e) => {
    // console.log(stage);
    stage.childs.forEach((element) => {
      if (element.interactive) {
        // отслеживаем, попали ли внутрь прямоугольника
        if (utils.hasPointInRect([e.clientX, e.clientY], element.getGeometry())) {
          element.onClick(e);
        }
      }
    });
  });

  function setParams(start, stage) {
    Application.start = start;
    Application.stage = stage;
  }

  let utils = {};
  utils.hasPointInRect = (point, params) => {
    if (
      point[0] >= params.x &&
      point[0] <= params.x + params.width &&
      point[1] >= params.y &&
      point[1] <= params.y + params.height
    )
      return true;
    return false;
  };
  utils.hasCollision = (o1, o2) => {};
  // Класс для загрузки ресурсов (картинок).
  class Resources {
    paths;
    resources = new Map();
    imageCount = 0;
    imagesLoaded = 0;
    load(...res) {
      if (res.length == 0) {
        Application.start();
      }
      this.paths = res;
      this.imageCount = res.length;
      for (let i = 0; i < this.paths.length; i++) {
        let img = new Image();
        img.src = this.paths[i];
        this.resources.set(this.paths[i], img);
        img.onload = () => {
          this.imagesLoaded++;
          if (this.imagesLoaded == this.imageCount) {
            // Когла все картинки загружены, можем начать что-то рисовать
            Application.start();
          }
        };
      }
    }
  }

  // Сцена, объекты попадающие сюда отрисовываются на канвасе
  class Stage {
    constructor() {
      this.type = 'Stage';
      this.childs = [];
    }
    add(obj) {
      obj.draw();
      obj.parent = this;
      this.childs.push(obj);
    }
    // Здесь очищается канвас и перерисовываются все объекты на сцене
    update() {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      this.childs.forEach((e) => {
        if (!e.isHide) e.draw();
      });
    }
  }
  // От данного класса наследуются все прямоугольные сущности
  class Square {
    constructor(x = 0, y = 0, w = 0, h = 0) {
      this._x = x;
      this._y = y;
      this._w = w;
      this._h = h;
      this.offsetX = 0;
      this.offsetY = 0;
      this.interactive = false;
      this.isHide = false;
    }
    hide() {
      this.isHide = true;
      if (this.parent) this.parent.update();
    }
    show() {
      this.isHide = false;
      if (this.parent) this.parent.update();
    }
    getGeometry() {
      return {
        x: this._x,
        y: this._y,
        xGlobal: this._x + this.offsetX,
        yGlobal: this._y + this.offsetY,
        width: this._w,
        height: this._h,
      };
    }
    onClick() {
      console.log(this);
    }
  }
  // Контейнер позволяет вкладывать в себя объекты, то есть группировать,
  // смещать все объекты разом, изменяя лишь параметры контейнера
  class Container extends Square {
    static id = 0;
    constructor() {
      super();
      this._childs = [];
      this.type = 'Container';
      this.id = Container.id++;
    }
    add(obj) {
      obj.offsetX = this._x + this.offsetX;
      obj.offsetY = this._y + this.offsetY;
      obj.parent = this;
      this._childs.push(obj);
      this.countWH();
      //   this.update();
    }
    set x(val) {
      this._x = val;
      this.updateOffset('_x', 'offsetX');
      if (this.parent) this.parent.update();
    }
    set y(val) {
      this._y = val;
      this.updateOffset('_y', 'offsetY');
      if (this.parent) this.parent.update();
    }
    // Нужна для пересчета длины и высоты контейнера, на основании добавляемых объектов
    countWH() {
      let pointsX = this._childs.map((e) => e._x + e._w);
      let pointsY = this._childs.map((e) => e._y + e._h);
      let maxX = Math.max(...pointsX);
      let maxY = Math.max(...pointsY);
      this._w = -this._x + maxX;
      this._h = -this._y + maxY;
    }
    // Если у контейнера меняются показатели отступов, т.е. х и у,
    // то все объекты в контейнере, рисуемые на канвасе, тоже должны сдвинуться
    updateOffset(prop, propertyToUpdate) {
      this._childs.forEach((e) => {
        if (e.type == 'Container') {
          e[propertyToUpdate] = this[prop] + this[propertyToUpdate];
          e.updateOffset(prop, propertyToUpdate);
        } else {
          e[propertyToUpdate] = this[prop] + this[propertyToUpdate];
        }
      });
    }
    draw() {
      this._childs.forEach((e) => e.draw());
    }
    // Вызываем обработчики у детей контейнера
    onClick(e) {
      this._childs.forEach((element) => {
        if (element.interactive) {
          // отслеживаем, попали ли внутрь прямоугольника
          if (utils.hasPointInRect([e.clientX, e.clientY], element.getGeometry())) {
            element.onClick();
          }
        }
      });
    }
    update() {
      this.countWH();
      if (this.parent) this.parent.update();
    }
  }
  // Прямоугольник
  class Rect extends Square {
    static id = 0;
    constructor(x, y, w, h) {
      super(x, y, w, h);
      this.type = 'Rect';
      this.fillstyle = '#000';
      this.id = Rect.id++;
    }
    get x() {
      return this._x;
    }
    get y() {
      return this._y;
    }
    set x(val) {
      this._x = val;
      if (this.parent) this.parent.update();
    }
    set y(val) {
      this._y = val;
      if (this.parent) this.parent.update();
    }
    set w(val) {
      this._w = val;
      if (this.parent) this.parent.update();
    }
    set h(val) {
      this._h = val;
      if (this.parent) this.parent.update();
    }
    set fillStyle(val) {
      this.fillstyle = val;
      if (this.parent) this.parent.update();
    }

    draw() {
      ctx.save();
      ctx.fillStyle = this.fillstyle;
      ctx.fillRect(this._x + this.offsetX, this._y + this.offsetY, this._w, this._h);
      ctx.restore();
    }
  }
  class Sprite extends Square {
    static id = 0;
    constructor(texture) {
      super(texture.x, texture.y, texture.width, texture.height);
      this.img = texture;
      this.sx = 0; //отступы в картинке
      this.sy = 0; //отступы в картинке
      this.k = this._w / this._h; //коэффициент мастштабирование
      this.sHeight = texture.height; //длина обрезки картинки
      this.sWidth = texture.width; //длина обрезки картинки
      this.withRatio = false;
      this.type = 'Sprite';
      this.id = Sprite.id++;
    }
    // Разметка, штука, которая описывает тайлы на спрайтлисте
    // размеры, позицию и т.д.
    setMarkup(m) {
      this.markup = m;
    }
    // выбрать тайл
    setTile(tileName) {
      let params = this.markup[tileName];
      this.sx = params[0];
      this.sy = params[1];
      this.sWidth = params[2];
      this.sHeight = params[3];
      if (this.parent) this.parent.update();
    }
    get x() {
      return this._x;
    }
    get y() {
      return this._y;
    }
    set x(val) {
      this._x = val;
      if (this.parent) this.parent.update();
    }
    set y(val) {
      this._y = val;
      if (this.parent) this.parent.update();
    }
    set w(val) {
      if (this.withRatio) {
        this._w = val;
        this._h = val / this.k;
      } else {
        this._w = val;
      }
      if (this.parent) this.parent.update();
    }
    set h(val) {
      if (this.withRatio) {
        this._h = val;
        this._w = val / this.k;
      } else {
        this._h = val;
      }
      if (this.parent) this.parent.update();
    }
    draw() {
      ctx.drawImage(
        this.img,
        this.sx,
        this.sy,
        this.sWidth,
        this.sHeight,
        this._x + this.offsetX,
        this._y + this.offsetY,
        this._w,
        this._h
      );
    }
  }

  class AnimatedSprite extends Sprite {
    static id = 0;
    constructor(tiles) {
      super(tiles);
      this.id = AnimatedSprite.id++;
      this.type = 'AnimatedSprite';
      this.animSpeed = 1;
      this.previousTime; //для того, чтобы определять скорость анимации на основе времени
    }
    // создает итератор, для перебора тайлов в массиве (анимация)
    iterate() {
      function* genSequence() {
        for (let i = 0; i < this.markup[this.selectedTiles].length; i++) {
          yield this.markup[this.selectedTiles][i];
        }
      }
      this.iterateTiles = genSequence.call(this);
    }
    // выбрать тайлы для анимации
    selectTiles(tiles) {
      this.selectedTiles = tiles;
      this.iterate();
    }

    animationSpeed(s = 1) {}
    // при вызове этого метода, меняется текстура.
    play() {
      if (!this.previousTime || Date.now() - this.previousTime > 17 / this.animSpeed) {
        let arrValue = this.iterateTiles.next().value;
        // если в массиве тайлов дошли до конца,
        // то идем по массиву заново
        if (!arrValue) {
          this.iterate();
          arrValue = this.iterateTiles.next().value;
        }
        this.sx = arrValue[0];
        this.sy = arrValue[1];
        this.sWidth = arrValue[2];
        this.sHeight = arrValue[3];
        if (this.parent) this.parent.update();
        this.previousTime = Date.now();
      }
    }
  }

  // Start();
  function Start() {
    window.requestAnimationFrame(Start);
  }

  let exports = {
    Resources,
    Stage,
    Square,
    Container,
    Rect,
    Sprite,
    AnimatedSprite,
    setParams,
  };
  return exports;
})();
