import axios from 'axios';

const webSync = async ( token: string ) => {
	return axios({
		method: 'PUT',
		url: 'https://api.mangarockhd.com/appsync/web_import',
		headers: {
			'Authorization': token
		}
	}).then((res: any) => {
		return res;
	});
};

const getFavorites = async ( token: string ) => {
	await webSync(token).then((r: any) => { console.log('Synced with Manga Rock') });

	return axios({
		method: 'POST',
		url: 'https://cors-anywhere.herokuapp.com/https://graphql.mangarock.io/graphql',
		headers: {
			'Content-Type': 'application/json',
 				'Authorization': token,
 				'Origin': null
		},
		data: JSON.stringify({
			"operationName": "favorites",
			"variables": {},
			"query": "query favorites($updatedAt: AWSDateTime, $nextToken: String) {\n  favorites: listFavoritesByUpdatedTimeWithPaging(updatedAt: $updatedAt, nextToken: $nextToken) {\n    items {\n      oid\n        __typename\n    }\n    __typename\n  }\n}\n"
		})
	}).then((res: any) => {
		return res.data.data.favorites.items
	});
};

export const checkExistUser = async ( email: string ) => {
	return axios({
		method: 'PUT',
		url: 'https://cors-anywhere.herokuapp.com/https://mangarock.com/ajax/account/checkExistedUser',
		headers: {
			'Origin': null,
 			'Content-Type': 'application/json',
 			'Referer': 'https://mangarock.com/account/login'
		},
		data: JSON.stringify({ email })
	}).then((res: any) => {
		return res.data.code === 0 ? true : false
	})
};

export const verifyPassword = ( email: string, password: string ) => {
	return axios({
		method: 'POST',
		url: 'https://us-central1-mangadexapi.cloudfunctions.net/mrLogin',
		headers: {
			'Content-Type': 'application/json'
		},
		data: JSON.stringify({ email, password })
	}).then((res: any) => {
		return res.data.token ? true : false
	}).catch(err => {
		return err
	})
};

export const MRtoMD = async ( list: any ) => {
	return axios({
		method: 'POST',
		url: 'https://us-central1-mangadexapi.cloudfunctions.net/bulkSearch',
		headers: {
			'Content-Type': 'application/json'
		},
		data: JSON.stringify(list)
	}).then((res: any) => {
		return res.data.results
	});
}

export const signIn = async ( email: string, password: string, proxy: boolean = false ) => {
	let options = {};

	if (proxy) {
		options = {
			method: 'POST',
			url: 'https://us-central1-mangadexapi.cloudfunctions.net/mrLogin',
			headers: {
				'Content-Type': 'application/json'
			},
			data: JSON.stringify({ email, password })
		}
	} else {
		options = {
			method: 'POST',
			url: 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyCFJPh6357HhIID3SgeRam2Cv6n139ymig',
			headers: {
				'Content-Type': 'application/json',
 				'Referer': 'https://mangarock.com/account/login'
			},
			data: JSON.stringify({ email, password, returnSecureToken: true })
		}
	}

	return axios(options).then((res: any) => {
		return res.data.token
	});
}

export const getMangaInfo = async ( token: any ) => {
	let favoriteList = await getFavorites(token);

	let oidList = [];

	let idObject = {
		oids: {},
		sections: ['basic_info']
	};

	favoriteList.forEach(manga => {
		idObject['oids'][manga['oid']] = 0;

		oidList.push({ 'oid': manga['oid'] });
	});

	return axios({
		method: 'POST',
		url: 'https://cors-anywhere.herokuapp.com/https://api.mangarockhd.com/query/web401/manga_detail',
		headers: {
			'Content-Type': 'application/json',
			'Origin': null
		},
		data: JSON.stringify(idObject)
	}).then((res: any) => {
		let mangaList = Object.values(res.data.data);
		let mangaInfo = [];

		mangaList.forEach(manga => {
			let basicInfo = manga['basic_info'];
			if (!basicInfo['name']) return;

			let currOid = manga['default']['oid'];

			oidList.forEach(item => {
				if (item['oid'] !== currOid) return;

				mangaInfo.push({
					name: basicInfo['name'],
					thumbnail: basicInfo['thumbnail'],
					description: basicInfo['description'],
					alias: basicInfo['alias']
				})
			})
		})

		return mangaInfo;
	});
}