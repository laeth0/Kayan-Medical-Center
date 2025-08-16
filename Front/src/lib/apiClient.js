import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

let accessToken = null;
let isRefreshing = false;
let subscribers = [];


function setAccessToken(t) {
  accessToken = t;
  if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
  else delete api.defaults.headers.common.Authorization;
}

function onRefreshed(token) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

function addSubscriber(cb) {
  subscribers.push(cb);
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});


api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    if (!response) return Promise.reject(error);

    if (response.status === 401 && !config._retry) {
      config._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          const { data } = await api.post("/refresh-token");
          setAccessToken(data.accessToken);
          isRefreshing = false;
          onRefreshed(data.accessToken);
        }

        return new Promise((resolve) => {
          addSubscriber((token) => {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(api(config));
          });
        });
      } catch (e) {
        isRefreshing = false;
        setAccessToken(null);
      }
    }

    return Promise.reject(error);
  }
);

export { setAccessToken };
export default api;
