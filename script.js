$(document).ready(function(){
    const historyButtonHolder = $("#history-button-holder");
    const futureWeatherHolder = $("#future-weather-holder");
    const searchButton = $(".search-button");
    const searchBar = $("#search-bar");

    var apiLink = "https://api.openweathermap.org/data/2.5/forecast?cnt=6&appid=a94f9c1940403092fb3e7511b13587a8";
    
    //default values
    var cityHistoryArray = ["Austin", "Chicago", "New York", "Orlando", "San Francisco", "Seattle", "Denver", "Atlanta"];

    //check for loaded data
    var loadedData = localStorage.getItem("the-saved-data-3897789796");
    loadedData = JSON.parse(loadedData);
    if(loadedData != null){
        cityHistoryArray = loadedData;
    }

    function searchByCity(cityName){
        $.ajax({
            url: apiLink + "&q=" + cityName,
            method: "GET"
        }).then(function(responce){
            //this is all to add the uv index
            var callUvIndexLink = "https://api.openweathermap.org/data/2.5/uvi?cnt=6&appid=" + apiKey + "&lat=" + responce.city.coord.lat +
                "&lon=" + responce.city.coord.lon;
            $.ajax({
                url: callUvIndexLink,
                method: "GET"
            }).then(function(_response){
                $("#uv-index").text(_response.value);
                if(_response.value < 3){
                    $("#uv-index").addClass("safe-uv").removeClass("warning-uv danger-uv big-danger-uv panic-uv");
                }
                else if(_response.value < 6){
                    $("#uv-index").addClass("warning-uv").removeClass("safe-uv danger-uv big-danger-uv panic-uv");
                }
                else if(_response.value < 8){
                    $("#uv-index").addClass("danger-uv").removeClass("warning-uv safe-uv big-danger-uv panic-uv");
                }
                else if(_response.value < 11){
                    $("#uv-index").addClass("big-danger-uv").removeClass("warning-uv danger-uv safe-uv panic-uv");
                }
                else{
                    $("#uv-index").addClass("panic-uv").removeClass("warning-uv danger-uv big-danger-uv safe-uv");
                }
            });
        
            var currentDate = " (" + moment().format("MM/DD/YYYY") + ") ";
        
            //sets the name of the city, then adds the icon to the end
            $("#city-name").text(responce.city.name + currentDate);
            var weatherIcon = $("<img>").attr("id", "weather-icon").attr("src", "https://openweathermap.org/img/wn/" + responce.list[0].weather[0].icon + "@2x.png");
            $("#city-name").append(weatherIcon);
            
            //add weather icon
            $("#weather-icon").attr("src", "https://openweathermap.org/img/wn/" + responce.list[0].weather[0].icon + "@2x.png")
    
            //get current temp
            var temp = responce.list[0].main.temp;
            //convert from K to F
            temp = (temp - 273.15) * (9 / 5) + 32;
            //round temp to 1 decimal place
            temp = temp.toFixed(1);
        
            $("#temperature").text(temp + " \u00B0F");
            $("#humidity").text(responce.list[0].main.humidity + "%");
            $("#wind-speed").text(responce.list[0].wind.speed + " MPH");

            //loop to create future info
            $(futureWeatherHolder).empty();
            for(var i = 1; i < 6; i++){
                var weatherHolderCard = $("<div>").addClass("rounded future-card col-sm-5 col-md-2 bg-primary");
                var dateDisplay = $("<div>").addClass("future-text future-date").text(moment().add(i, "days").format("MM/DD/YYYY"));
                var iconDisplay = $("<img>").addClass("future-icon").attr("src", "https://openweathermap.org/img/wn/" + responce.list[i].weather[0].icon + "@2x.png")
                
                var futureTemp = responce.list[i].main.temp
                futureTemp = (futureTemp - 273.15) * (9 / 5) + 32;
                futureTemp = futureTemp.toFixed(1);
                var tempDisplay = $("<div>").addClass("future-text").text("Temp: " + futureTemp + " \u00B0F");
                var humidityDisplay = $("<div>").addClass("future-text").text("Humidity: " + responce.list[i].main.humidity + "%");

                $(weatherHolderCard).append(dateDisplay, iconDisplay, tempDisplay, humidityDisplay);
                $(futureWeatherHolder).append(weatherHolderCard);
            }
        });
    }

    //move a search-for or clicked-on history item to the begginning of the array
    function reorderHistoryButtons(indexOfItem){
        //moves the item to the front of the array
        cityHistoryArray.unshift(cityHistoryArray.splice(indexOfItem, 1));

        //set new displayed values
        $.each(historyButtonHolder.children("button"), function(i, index){
            $(index).text(cityHistoryArray[i]);
        }); 

        localStorage.setItem("the-saved-data-3897789796", JSON.stringify(cityHistoryArray));
    }

    //called after a search
    function saveNewHistory(newSearchTerm){
        //check if this is a new city
        var checkIfNewCity = true;
        //used to reorder array for history buttons in case of repeat searches
        var previousEntryIndex = 0;
        $.each(historyButtonHolder.children("button"), function(i, index){
            if($(index).text().toLowerCase() == newSearchTerm.toLowerCase()){
                checkIfNewCity = false;
                previousEntryIndex = i;
            }
        });
        
        //only runs if the city is a new one
        if(checkIfNewCity){
            //change and save array
            cityHistoryArray.unshift(newSearchTerm);
            cityHistoryArray.pop();
            localStorage.setItem("the-saved-data-3897789796", JSON.stringify(cityHistoryArray));

            //set new displayed values
            $.each(historyButtonHolder.children("button"), function(i, index){
                $(index).text(cityHistoryArray[i]);
            }); 
        }
        else
        {
            reorderHistoryButtons(previousEntryIndex);
        }
    }

    //set to last searched item at run
    searchByCity(cityHistoryArray[0]);

    //assign history buttons
    $.each(historyButtonHolder.children("button"), function(i, index){
        $(index).text(cityHistoryArray[i]).click(function(event){
            event.preventDefault();
            event.stopPropagation();
            searchByCity($(this).text());
            reorderHistoryButtons(i);
        });
    });

    //search button
    $(searchButton).click(function(event){
        event.preventDefault();
        event.stopPropagation();
        var searchTerm = $(searchBar).val();
        $(searchBar).val("");

        //check to make sure search term is valid
        $.ajax({
            url: apiLink + "&q=" + searchTerm,
            method: "GET"
        }).then(function(response){
            saveNewHistory(searchTerm);
            searchByCity(searchTerm);
        });
    });

    //search when "return/enter" key is pressed while text area is focused
    $("#search-bar").keydown(function(event){
        event.stopPropagation();

        if(event.which == 13){
            var searchTerm = $(searchBar).val();
            $(searchBar).val("");
    
            //check to make sure search term is valid
            $.ajax({
                url: apiLink + "&q=" + searchTerm,
                method: "GET"
            }).then(function(response){
                saveNewHistory(searchTerm);
                searchByCity(searchTerm);
            });
        }
    });
});