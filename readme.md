# 2D Fruity - Mosi's Personal HTML5 Game Framework

### Hello me from the future ->

Clone this sexy repo. Create an 'index.html' page with the following code in it.
```html
<!DOCTYPE html>
<html>
<head>
    <script src='./lib.js'></script>
</head>
<body>
    <div id='game'></div>
    <script>
        
    </script>
</body>
</html>
```

Add the following inside the script tag.

```javascript
var config = {
    height: 200,
    width: 200,
    scenes: [LIB.DemoScene],
    mouse: false,
    keyboard: false,
    smoothing: true,
};

var game = new LIB.Game(config);
```

Now read through 'lib.js', it's pretty intuitive. I believe in you!