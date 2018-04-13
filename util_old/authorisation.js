module.exports = (base_url,role) => {
    if (base_url == '/admin' && role == 'door')
        return true
    if (base_url == '/partner' && role == 'partner')
        return true
    if (base_url == '/adminPartner' && (role == 'door' || role == 'partner'))
        return true
    return false
}