document.addEventListener('DOMContentLoaded', ()=>{
  const apiKey = '4d7d0912d819bc8ea0e6661d1cc2b571';
    const city = document.getElementById('fav').value;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;  
  fetch(url)
      .then(res => res.json())
      .then(data => {
          document.getElementById('fav-place').innerHTML = data.name;
          document.getElementById('fav-temp').innerHTML = 'Temp : '+ data.main.temp;
          console.log(data)
      }).catch(error => console.log(error));
})

const form = document.querySelector('form')

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const apiKey = '4d7d0912d819bc8ea0e6661d1cc2b571';
    const city = document.getElementById('city').value;
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;
    const forecast = document.getElementById("forecast")
    const loc = document.getElementById('loc')

    fetch(url)
        .then(res => res.json())
        .then(data => {
              for(i=0;i<5;i++){
                document.getElementById("day" +(i+1)+"Min").innerHTML = "Min : "+ Number(data.list[i].main.temp_min -273.15).toFixed(1)+" deg";
              }
              for(i=0;i<5;i++){
                document.getElementById("day" +(i+1)+"Max").innerHTML = "Max : "+ Number(data.list[i].main.temp_max -273.15).toFixed(1)+" deg";
              }
              for(i=0;i<5;i++){
                document.getElementById("img" +(i+1)).src = "http://openweathermap.org/img/wn/"+data.list[i].weather[0].icon+".png";
              }
              document.getElementById('loc').innerHTML = data.city.name;
              forecast.style.visibility = "visible";
              loc.style.visibility = "visible";
              Notification.requestPermission().then(permission => {
                if(permission === 'granted'){
                  new Notification("Weather Forecast",
                    {
                      body: `The current temperature in ${(data.city.name).toUpperCase()} is ${((data.list[0].main.temp_min) - 273.15).toFixed(1)+"°C"}`,
                      icon:"/images/cloud2.png"
                    }
                  )
                }
              })
            console.log(data)
        }).catch(error => console.log(error));
        document.getElementById('city').value = ""
        const d = new Date()
        const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        function checkDay(day){
            if(day + d.getDay > 7){
                return (day + d.getDay()) % 7;
            }else{
                return day + d.getDay();
            }
        }
        for(i=0;i<5;i++){
            document.getElementById("day"+(i+1)).innerHTML = weekday[checkDay(i)];
        }
})